import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

// ============================================================================
// GET /api/v1/notifications
// Menggabungkan 3 jenis notifikasi operasional:
// 1. Kegiatan yang mendekati 5 hari (foundation_programs)
// 2. Pendaftaran anggota yang perlu diverifikasi (member_registrations status = PENDING)
// 3. Pinjaman aset yang butuh persetujuan / aktif (asset_loans status = PENDING / approaching return)
// ============================================================================
router.get('/', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Kegiatan mendekati 5 hari
    const programsQuery = `
      SELECT 
        id,
        program_title,
        program_category,
        event_datetime,
        location,
        speaker_name,
        created_at,
        ROUND(EXTRACT(EPOCH FROM (event_datetime - NOW())) / 86400.0, 1) as exact_days_left,
        CEIL(EXTRACT(EPOCH FROM (event_datetime - NOW())) / 86400.0)::int as days_left
      FROM foundation_programs
      WHERE event_datetime >= NOW() - INTERVAL '12 hours'
        AND event_datetime <= NOW() + INTERVAL '5 days 23 hours 59 minutes'
      ORDER BY event_datetime ASC
    `;
    const programsRes = await db.query(programsQuery);

    const programNotifications = programsRes.rows.map((p) => {
      const days = p.days_left;
      let badge = 'H-0 (Hari ini)';
      if (days === 1) badge = 'H-1 (Besok)';
      else if (days > 1) badge = `H-${days} (${days} hari lagi)`;
      else if (days < 0) badge = 'Sedang Berlangsung';

      return {
        id: `prog-${p.id}`,
        rawId: p.id,
        type: 'PROGRAM' as const,
        title: p.program_title,
        category: p.program_category,
        description: `Jadwal: ${new Date(p.event_datetime).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} WIB · Lokasi: ${p.location || 'Rumah Persekutuan GMH'}${p.speaker_name ? ` · Pembicara: ${p.speaker_name}` : ''}`,
        date: p.event_datetime,
        daysLeft: p.days_left,
        badgeText: badge,
        badgeType: days <= 1 ? 'urgent' : 'warning',
        targetUrl: '/programs',
        createdAt: p.created_at,
      };
    });

    // 2. Pendaftaran anggota yang perlu diverifikasi
    const registrationsQuery = `
      SELECT 
        id,
        registration_code,
        full_name,
        email,
        phone_number,
        faculty,
        major,
        entry_year,
        created_at
      FROM member_registrations
      WHERE status = 'PENDING'
      ORDER BY created_at DESC
    `;
    const regRes = await db.query(registrationsQuery);

    const registrationNotifications = regRes.rows.map((r) => ({
      id: `reg-${r.id}`,
      rawId: r.id,
      type: 'REGISTRATION' as const,
      title: `Pendaftaran Baru: ${r.full_name}`,
      category: r.faculty ? `Fakultas ${r.faculty}` : 'Pendaftar Baru',
      description: `Kode: ${r.registration_code || 'REG'} · Pendaftar baru menunggu verifikasi admin (${r.email || r.phone_number || 'Data terkirim'}). Klik untuk meninjau berkas.`,
      date: r.created_at,
      badgeText: 'Perlu Verifikasi',
      badgeType: 'info',
      targetUrl: '/registrations',
      createdAt: r.created_at,
    }));

    // 3. Pinjaman aset (Pending butuh persetujuan admin & aktif mendekati jatuh tempo)
    const loansQuery = `
      SELECT 
        al.id,
        al.asset_id,
        al.borrower_name,
        al.borrower_phone,
        al.borrower_institution,
        al.borrowed_at,
        al.expected_return_at,
        al.status,
        al.loan_type,
        al.created_at,
        a.asset_name,
        a.asset_code
      FROM asset_loans al
      LEFT JOIN assets a ON al.asset_id = a.id
      WHERE al.status = 'PENDING'
         OR (al.status = 'ACTIVE' AND al.expected_return_at <= NOW() + INTERVAL '3 days')
      ORDER BY al.created_at DESC
    `;
    const loansRes = await db.query(loansQuery);

    const loanNotifications = loansRes.rows.map((l) => {
      const isPending = l.status === 'PENDING';
      return {
        id: `loan-${l.id}`,
        rawId: l.id,
        type: 'ASSET_LOAN' as const,
        title: isPending
          ? `Pengajuan Pinjaman: ${l.asset_name || 'Aset Yayasan'}`
          : `Jatuh Tempo Pengembalian: ${l.asset_name || 'Aset Yayasan'}`,
        category: l.loan_type || 'PINJAM',
        description: isPending
          ? `Pemohon: ${l.borrower_name}${l.borrower_phone ? ` (${l.borrower_phone})` : ''} · Menunggu persetujuan admin untuk pemakaian fasilitas.`
          : `Peminjam: ${l.borrower_name} · Jadwal kembali: ${l.expected_return_at ? new Date(l.expected_return_at).toLocaleDateString('id-ID') : 'Segera'}.`,
        date: isPending ? l.borrowed_at : l.expected_return_at,
        badgeText: isPending ? 'Butuh Persetujuan' : 'Jatuh Tempo',
        badgeType: isPending ? 'warning' : 'urgent',
        targetUrl: '/assets',
        createdAt: l.created_at,
      };
    });

    // Combine all
    const allNotifications = [
      ...programNotifications,
      ...registrationNotifications,
      ...loanNotifications,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      success: true,
      totalCount: allNotifications.length,
      counts: {
        total: allNotifications.length,
        programs: programNotifications.length,
        registrations: registrationNotifications.length,
        loans: loanNotifications.length,
      },
      notifications: allNotifications,
      groups: {
        programs: programNotifications,
        registrations: registrationNotifications,
        loans: loanNotifications,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat notifikasi sistem.',
      error: err.message,
    });
  }
});

export default router;
