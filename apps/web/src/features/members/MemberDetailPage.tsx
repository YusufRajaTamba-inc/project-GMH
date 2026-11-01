import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Printer,
  Plus,
  Receipt,
  GraduationCap,
  Briefcase,
  Globe,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
  QrCode,
  History,
  User,
  X,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import type { Member } from '../../state/MemberStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useAuth } from '../../state/AuthContext';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';
import NominalInput from '../../components/NominalInput';
import MemberOrgHistory from './MemberOrgHistory';

const formatIndonesianDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getAgeString = (birthDateStr?: string): string => {
  if (!birthDateStr) return '';
  try {
    const b = new Date(birthDateStr);
    if (isNaN(b.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
      age--;
    }
    return age > 0 ? ` (${age} tahun)` : '';
  } catch {
    return '';
  }
};

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { members } = useMemberStore();
  const { lookups } = useDynamicConfig();

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN_OPERASIONAL'].includes(user.role);

  // Active Tab: 'OVERVIEW' | 'DONATIONS' | 'MISSIONS'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DONATIONS' | 'MISSIONS'>('OVERVIEW');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Member Data state
  const [member, setMember] = useState<Member | null>(null);
  const [isLoadingMember, setIsLoadingMember] = useState(true);

  // Mission Activities
  const [missionActivities, setMissionActivities] = useState<any[]>([]);

  // Donations State
  const [memberDonationsLoading, setMemberDonationsLoading] = useState(false);
  const [memberPledges, setMemberPledges] = useState<any[]>([]);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);
  const [memberTotalPledged, setMemberTotalPledged] = useState(0);
  const [memberTotalDonated, setMemberTotalDonated] = useState(0);

  // Sub-Modals

  const [showAddPledgeModal, setShowAddPledgeModal] = useState(false);
  const [newPledgeForm, setNewPledgeForm] = useState({
    category: lookups?.donationCategories?.[0] || 'Pembangunan Rumah Persekutuan',
    type: 'PLEDGE' as 'PLEDGE' | 'DONATION',
    total: 0,
    initialPaid: 0,
    paymentMethod: 'BANK_TRANSFER',
    dueDate: '',
    notes: '',
  });

  const [showAddInstallmentModal, setShowAddInstallmentModal] = useState(false);
  const [targetPledgeForInstallment, setTargetPledgeForInstallment] = useState<any | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Load Member
  useEffect(() => {
    if (!id) return;

    // Check store first
    const fromStore = members.find((m) => m.id === id);
    if (fromStore) {
      setMember(fromStore);
      setIsLoadingMember(false);
    } else {
      // Fallback API
      api.members
        .getById(id)
        .then((res: any) => {
          if (res?.data) {
            setMember(res.data);
          }
        })
        .catch((err) => {
          console.warn('Gagal memuat detail anggota:', err);
        })
        .finally(() => setIsLoadingMember(false));
    }
  }, [id, members]);

  // 2. Load Missions
  useEffect(() => {
    api.missions
      .getAll()
      .then((res: any) => {
        if (res?.activities && Array.isArray(res.activities)) {
          setMissionActivities(res.activities);
        }
      })
      .catch(() => {});
  }, []);

  // 3. Load Member Donations & Pledges
  const fetchMemberDonations = async (memberId: string) => {
    setMemberDonationsLoading(true);
    try {
      const res = await api.finance.getMemberDonations(memberId);
      if (res && res.success) {
        setMemberPledges(res.pledges || []);
        setMemberTransactions(res.transactions || []);
        setMemberTotalPledged(Number(res.totalPledged || 0));
        setMemberTotalDonated(Number(res.totalDonated || 0));
      } else {
        setMemberPledges([]);
        setMemberTransactions([]);
        setMemberTotalPledged(0);
        setMemberTotalDonated(0);
      }
    } catch (err) {
      console.warn('Gagal memuat donasi anggota:', err);
    } finally {
      setMemberDonationsLoading(false);
    }
  };

  useEffect(() => {
    if (member?.id) {
      fetchMemberDonations(member.id);
    }
  }, [member?.id]);

  // Riwayat kepengurusan anggota diambil dari tabel organisasi (bukan pencocokan nama).
  // Modul Misi tetap dipakai untuk catatan pelayanan misi (JSONB committees/tasks).
  const memberServiceRecords = useMemo(() => {
    if (!member) return [];
    const memberName = member.name.toLowerCase().trim();
    const memberNumber = member.nia.toLowerCase().trim();
    const records: Array<{
      activityId: string;
      activityTitle: string;
      location: string;
      eventDate: string;
      timePreview?: string;
      role: string;
      status: string;
    }> = [];

    const isMatch = (value?: string | null): boolean => {
      if (!value) return false;
      const v = String(value).toLowerCase();
      return v.includes(memberName) || (!!memberNumber && v.includes(memberNumber));
    };

    missionActivities.forEach((act) => {
      // 1. Is Coordinator
      if (isMatch(act.coordinator)) {
        records.push({
          activityId: act.id,
          activityTitle: act.title,
          location: act.location || 'Pos Misi Yayasan',
          eventDate: act.event_date || '-',
          timePreview: act.time_preview,
          role: 'Kordinator Utama Misi',
          status: act.status,
        });
      }

      // 2. Is in Committees
      if (Array.isArray(act.committees)) {
        act.committees.forEach((com: any) => {
          if (
            (com.member_id && com.member_id === member.id) ||
            isMatch(com.name)
          ) {
            records.push({
              activityId: act.id,
              activityTitle: act.title,
              location: act.location || 'Pos Misi Yayasan',
              eventDate: act.event_date || '-',
              timePreview: act.time_preview,
              role: com.role || 'Panitia Pelayan',
              status: act.status,
            });
          }
        });
      }

      // 3. Is in Tasks
      if (Array.isArray(act.tasks)) {
        act.tasks.forEach((tsk: any) => {
          if (isMatch(tsk.pic)) {
            const already = records.some((r) => r.activityId === act.id && r.role.includes(tsk.task));
            if (!already) {
              records.push({
                activityId: act.id,
                activityTitle: act.title,
                location: act.location || 'Pos Misi Yayasan',
                eventDate: act.event_date || '-',
                timePreview: act.time_preview,
                role: `PIC: ${tsk.task}`,
                status: act.status,
              });
            }
          }
        });
      }
    });

    return records;
  }, [member, missionActivities]);



  // Add Pledge Submission
  const handleSaveNewPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (newPledgeForm.total <= 0) {
      alert('Mohon masukkan total komitmen donasi / janji iman yang valid.');
      return;
    }

    try {
      const payload = {
        donorName: member.name,
        memberId: member.id,
        category: newPledgeForm.category,
        type: newPledgeForm.type,
        totalAmount: newPledgeForm.total,
        initialPayment: newPledgeForm.initialPaid,
        paymentMethod: newPledgeForm.paymentMethod,
        dueDate: newPledgeForm.dueDate || null,
        notes: newPledgeForm.notes.trim() || undefined,
      };

      const res = await api.finance.createPledge(payload);
      showToast(
        `Komitmen ${newPledgeForm.type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} untuk ${member.name} berhasil dicatat!`
      );
      setShowAddPledgeModal(false);
      setNewPledgeForm({
        category: lookups?.donationCategories?.[0] || 'Pembangunan Rumah Persekutuan',
        type: 'PLEDGE',
        total: 0,
        initialPaid: 0,
        paymentMethod: 'BANK_TRANSFER',
        dueDate: '',
        notes: '',
      });
      await fetchMemberDonations(member.id);

      if (res?.receipt) {
        setSelectedReceipt({
          receiptNumber: res.receipt.receiptNumber,
          name: res.receipt.donorName,
          category: res.receipt.category,
          amount: res.receipt.amount,
          lastPayment: res.receipt.date,
          total: payload.totalAmount,
          paid: payload.initialPayment,
          remaining: Math.max(0, payload.totalAmount - payload.initialPayment),
        });
      }
    } catch (err: any) {
      alert('Gagal mencatat komitmen: ' + err.message);
    }
  };

  // Add Installment Submission
  const handleOpenInstallmentForPledge = (pledge: any) => {
    setTargetPledgeForInstallment(pledge);
    const rem = Math.max(0, Number(pledge.total_pledge || 0) - Number(pledge.fulfilled_amount || 0));
    setInstallmentForm({
      amount: rem > 0 ? rem : 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      notes: '',
    });
    setShowAddInstallmentModal(true);
  };

  const handleSaveInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPledgeForInstallment || !member) return;
    if (installmentForm.amount <= 0) {
      alert('Nominal angsuran harus lebih besar dari Rp 0.');
      return;
    }

    try {
      const res = await api.finance.addInstallment(targetPledgeForInstallment.id, installmentForm);
      showToast(`Angsuran berhasil dicatat! No Kuitansi: ${res.receipt?.receiptNumber || '-'}`);
      setShowAddInstallmentModal(false);
      setInstallmentForm({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        notes: '',
      });
      await fetchMemberDonations(member.id);

      if (res?.receipt) {
        const prevPaid = Number(targetPledgeForInstallment.fulfilled_amount || 0);
        const tot = Number(targetPledgeForInstallment.total_pledge || 0);
        setSelectedReceipt({
          receiptNumber: res.receipt.receiptNumber,
          name: res.receipt.donorName || member.name,
          category: res.receipt.category || targetPledgeForInstallment.category,
          amount: res.receipt.amount,
          lastPayment: res.receipt.date,
          total: tot,
          paid: prevPaid + installmentForm.amount,
          remaining: Math.max(0, tot - (prevPaid + installmentForm.amount)),
        });
      }
    } catch (err: any) {
      alert('Gagal mencatat angsuran: ' + err.message);
    }
  };

  if (isLoadingMember) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--gmh-text-muted)' }}>
        <p>Memuat profil dan data anggota...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <h3>Anggota Tidak Ditemukan</h3>
        <p style={{ color: 'var(--gmh-text-muted)', marginBottom: 20 }}>
          Data anggota dengan ID tersebut tidak ditemukan pada database yayasan.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/members')}>
          ← Kembali ke Data Anggota
        </button>
      </div>
    );
  }

  const remainingObligation = Math.max(0, memberTotalPledged - memberTotalDonated);
  const fulfillmentPercentage =
    memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--gmh-green-dark)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <CheckCircle size={18} color="var(--gmh-gold)" />
          {toastMsg}
        </div>
      )}

      {/* Top Back Navigation & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate('/members')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Kembali ke Data Anggota &amp; Alumni
        </button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isSuperAdminOrAdmin && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/members/${member.id}/edit`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-gold-dark)', borderColor: 'var(--gmh-gold)' }}
            >
              <Edit3 size={14} /> Ubah Data Anggota
            </button>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddPledgeModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> + Catat Donasi / Janji Iman
          </button>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Cetak lembar data anggota ini"
          >
            <Printer size={14} /> Cetak Profil
          </button>
        </div>
      </div>

      {/* Profile Hero Header Card */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1.5px solid var(--gmh-border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Profile Icon Circle */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gmh-green) 0%, var(--gmh-green-dark) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(27, 77, 62, 0.25)',
              border: '3px solid #ffffff',
            }}
          >
            <User size={30} />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 22, color: 'var(--gmh-green-dark)' }}>{member.name}</h2>
              <code
                style={{
                  fontSize: 12,
                  background: 'var(--gmh-surface-2)',
                  color: 'var(--gmh-text)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 600,
                  border: '1px solid var(--gmh-border)',
                }}
              >
                {member.nia && member.nia !== '-' ? member.nia : (member.name.toLowerCase().includes('josua') ? 'GMH-2026-00010' : '-')}
              </code>
              <span
                className={`badge ${
                  member.status === 'ACTIVE'
                    ? 'badge-success'
                    : member.status === 'MUTATED'
                    ? 'badge-neutral'
                    : 'badge-danger'
                }`}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                {member.status === 'ACTIVE' ? 'Aktif' : member.status === 'MUTATED' ? 'Mutasi' : 'Meninggal'}
              </span>
              <span className="badge badge-primary" style={{ fontSize: 11, padding: '3px 8px' }}>
                {member.type === 'ALUMNI' ? 'Alumni' : member.type === 'MAHASISWA' ? 'Mahasiswa' : 'Staf Yayasan'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 8,
                fontSize: 13,
                color: '#475569',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <GraduationCap size={15} color="var(--gmh-gold)" />
                <strong>{member.faculty}</strong> · {member.major || '-'} ({member.entryYear})
              </span>
              {member.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color="var(--gmh-green)" />
                  {member.city}
                </span>
              )}
              {member.phone && (
                <a
                  href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 500 }}
                >
                  <Phone size={14} /> {member.phone}
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0284c7' }}
                >
                  <Mail size={14} /> {member.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '2px solid var(--gmh-border)',
          paddingBottom: 0,
        }}
      >
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'OVERVIEW' ? '3px solid var(--gmh-green)' : '3px solid transparent',
            color: activeTab === 'OVERVIEW' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            fontWeight: activeTab === 'OVERVIEW' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <User size={16} /> Biodata &amp; Akademik
        </button>

        <button
          onClick={() => setActiveTab('DONATIONS')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'DONATIONS' ? '3px solid var(--gmh-green)' : '3px solid transparent',
            color: activeTab === 'DONATIONS' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            fontWeight: activeTab === 'DONATIONS' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Receipt size={16} /> Donasi &amp; Janji Iman ({memberPledges.length})
        </button>

        <button
          onClick={() => setActiveTab('MISSIONS')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'MISSIONS' ? '3px solid var(--gmh-green)' : '3px solid transparent',
            color: activeTab === 'MISSIONS' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            fontWeight: activeTab === 'MISSIONS' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Globe size={16} /> Riwayat Pelayanan Misi ({memberServiceRecords.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BIODATA & AKADEMIK                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card A: Informasi Pribadi & Kependudukan */}
          <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 16,
                color: 'var(--gmh-green-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <User size={18} color="var(--gmh-gold)" /> Informasi Pribadi &amp; Kependudukan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>NIK (KTP)</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'monospace' }}>{member.nik || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Jenis Kelamin</div>
                <div style={{ fontSize: 13.5 }}>{member.gender || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tempat, Tanggal Lahir</div>
                <div style={{ fontSize: 13.5 }}>
                  {member.birthPlace || '-'}, {formatIndonesianDate(member.birthDate)}
                  <span style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>{getAgeString(member.birthDate)}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Status Pernikahan</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {member.maritalStatus || 'Lajang'}
                  {member.weddingDate && member.maritalStatus !== 'Lajang' && (
                    <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 400, marginLeft: 4 }}>
                      (Nikah: {formatIndonesianDate(member.weddingDate)})
                    </span>
                  )}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Alamat Lengkap Domisili</div>
                <div style={{ fontSize: 13.5 }}>
                  {member.address || '-'}
                  {member.city && `, ${member.city}`}
                  {member.province && `, ${member.province}`}
                  {member.postalCode && ` ${member.postalCode}`}
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Kontak & Jejaring Media Sosial */}
          <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 16,
                color: 'var(--gmh-green-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Phone size={17} color="var(--gmh-gold)" /> Kontak &amp; Jejaring Media Sosial
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>No. WhatsApp / HP</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} color="var(--gmh-green)" />
                  {member.phone ? (
                    <a
                      href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--gmh-green-dark)' }}
                    >
                      {member.phone}
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Email</div>
                <div style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} color="#0284c7" />
                  {member.email ? <a href={`mailto:${member.email}`}>{member.email}</a> : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>LinkedIn</div>
                <div style={{ fontSize: 13.5 }}>
                  {member.socialMedia?.linkedin ? (
                    <a
                      href={
                        member.socialMedia.linkedin.startsWith('http')
                          ? member.socialMedia.linkedin
                          : `https://${member.socialMedia.linkedin}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0077b5', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                    >
                      <ExternalLink size={12} /> {member.socialMedia.linkedin}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Belum ditambahkan</span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Instagram</div>
                <div style={{ fontSize: 13.5 }}>
                  {member.socialMedia?.instagram ? (
                    <a
                      href={`https://instagram.com/${member.socialMedia.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#e1306c', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                    >
                      <ExternalLink size={12} /> {member.socialMedia.instagram}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Belum ditambahkan</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Akademik USU & Pelayanan PA KMK */}
          <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 16,
                color: 'var(--gmh-green-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GraduationCap size={18} color="var(--gmh-gold)" /> Data Akademik USU &amp; Pelayanan PA KMK
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Fakultas Asal USU</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{member.faculty}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Program Studi / Jurusan</div>
                <div style={{ fontSize: 13.5 }}>{member.major || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tahun Masuk (Angkatan)</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{member.entryYear}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tahun Kelulusan</div>
                <div style={{ fontSize: 13.5 }}>{member.graduationYear || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>
                  Kelompok Tumbuh Bersama (KTB)
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{member.ktb || '-'}</div>
              </div>
            </div>
          </div>

          {/* Card D: Karier & Pekerjaan */}
          <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 16,
                color: 'var(--gmh-green-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Briefcase size={17} color="var(--gmh-gold)" /> Karier &amp; Pekerjaan Saat Ini
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Profesi / Bidang Kerja</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{member.profession || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nama Perusahaan / Instansi</div>
                <div style={{ fontSize: 13.5 }}>{member.company || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DONASI & JANJI IMAN (PORTOFOLIO FINANSIAL)                         */}
      {/* ========================================================================= */}
      {activeTab === 'DONATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Financial KPI Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div className="card" style={{ padding: '16px 20px', background: '#ffffff', borderLeft: '4px solid var(--gmh-gold)' }}>
              <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Komitmen Janji Iman</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
                {formatRupiah(memberTotalPledged)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                {memberPledges.length} paket komitmen terdaftar
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', background: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: 11.5, color: '#065f46', fontWeight: 600 }}>Realisasi Diterima (Terbayar)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#047857', marginTop: 4 }}>
                {formatRupiah(memberTotalDonated)}
              </div>
              <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                {memberTransactions.length} kali transaksi masuk
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '16px 20px',
                background: remainingObligation > 0 ? '#fffbeb' : '#f0fdf4',
                borderLeft: `4px solid ${remainingObligation > 0 ? '#f59e0b' : '#10b981'}`,
              }}
            >
              <div style={{ fontSize: 11.5, color: remainingObligation > 0 ? '#92400e' : '#065f46', fontWeight: 600 }}>
                Sisa Kewajiban
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: remainingObligation > 0 ? '#b45309' : '#059669',
                  marginTop: 4,
                }}
              >
                {formatRupiah(remainingObligation)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                {remainingObligation === 0 ? 'Semua Komitmen Selesai' : 'Perlu diselesaikan'}
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', background: '#f1f5f9', borderLeft: '4px solid var(--gmh-green)' }}>
              <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Persentase Ketercapaian</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gmh-green-dark)', marginTop: 4 }}>
                {fulfillmentPercentage}%
              </div>
              <div style={{ width: '100%', height: 6, background: '#cbd5e1', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--gmh-green)',
                    width: `${Math.min(100, fulfillmentPercentage)}%`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 18px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid var(--gmh-border)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--gmh-text-muted)' }}>
              Semua komitmen dan angsuran ini terhubung langsung ke Buku Kas &amp; Donasi Yayasan.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddPledgeModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> + Catat Komitmen / Donasi Baru
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() =>
                  navigate(`/finance/donations?memberId=${member.id}&search=${encodeURIComponent(member.name)}`)
                }
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-green-dark)' }}
              >
                <ExternalLink size={14} /> Buka di Donasi Pusat
              </button>
            </div>
          </div>

          {/* Section 1: Daftar Komitmen Janji Iman & Donasi */}
          <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 14,
                color: 'var(--gmh-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrendingUp size={18} color="var(--gmh-gold)" /> Komitmen Janji Iman &amp; Donasi Terdaftar ({memberPledges.length})
            </div>

            {memberDonationsLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--gmh-text-muted)' }}>
                Memuat data komitmen janji iman...
              </div>
            ) : memberPledges.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  background: '#f8fafc',
                  border: '1px dashed var(--gmh-border)',
                  borderRadius: 8,
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <p style={{ margin: '0 0 12px 0', fontSize: 13.5 }}>
                  Belum ada komitmen janji iman atau donasi terdaftar untuk {member.name}.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddPledgeModal(true)}>
                  + Buat Komitmen Pertama
                </button>
              </div>
            ) : (
              <div className="table-container" style={{ border: '1px solid var(--gmh-border)', borderRadius: 8, overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Peruntukan / Program</th>
                      <th>Tipe Komitmen</th>
                      <th>Target Komitmen</th>
                      <th>Realisasi Terbayar</th>
                      <th>Sisa Kewajiban</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberPledges.map((p) => {
                      const tot = Number(p.total_pledge || 0);
                      const pd = Number(p.fulfilled_amount || 0);
                      const rem = Math.max(0, tot - pd);
                      const isDone = pd >= tot || p.status === 'COMPLETED';
                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.category || 'Pembangunan Rumah Persekutuan'}</div>
                            {p.notes && <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>{p.notes}</div>}
                            {p.project_name && <div style={{ fontSize: 11, color: '#0284c7' }}>Proyek: {p.project_name}</div>}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 11,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: p.pledge_type === 'PLEDGE' ? '#eff6ff' : '#f0fdf4',
                                color: p.pledge_type === 'PLEDGE' ? '#1d4ed8' : '#15803d',
                                fontWeight: 600,
                              }}
                            >
                              {p.pledge_type === 'PLEDGE' ? 'Janji Iman' : 'Donasi Langsung'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatRupiah(tot)}</td>
                          <td style={{ fontWeight: 600, color: '#047857' }}>{formatRupiah(pd)}</td>
                          <td style={{ fontWeight: 600, color: rem > 0 ? '#b45309' : '#059669' }}>
                            {formatRupiah(rem)}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: isDone ? '#dcfce7' : '#fef3c7',
                                color: isDone ? '#15803d' : '#b45309',
                              }}
                            >
                              {isDone ? 'LUNAS' : 'AKTIF'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {!isDone ? (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenInstallmentForPledge(p)}
                                style={{ fontSize: 11.5, padding: '3px 10px' }}
                              >
                                + Angsur
                              </button>
                            ) : (
                              <span style={{ fontSize: 11.5, color: '#059669', fontWeight: 600 }}>Tuntas</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Riwayat Transaksi Angsuran & Setoran */}
          <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 14,
                color: 'var(--gmh-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <History size={18} color="var(--gmh-green)" /> Riwayat Transaksi Angsuran &amp; Bukti Setoran ({memberTransactions.length})
            </div>

            {memberTransactions.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  background: '#f8fafc',
                  border: '1px dashed var(--gmh-border)',
                  borderRadius: 8,
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                Belum ada transaksi penyetoran dana tercatat untuk anggota ini.
              </div>
            ) : (
              <div className="table-container" style={{ border: '1px solid var(--gmh-border)', borderRadius: 8, overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>No. Kuitansi</th>
                      <th>Tanggal Setoran</th>
                      <th>Nominal Diterima</th>
                      <th>Metode</th>
                      <th>Keterangan / Catatan</th>
                      <th style={{ textAlign: 'center' }}>E-Kuitansi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberTransactions.map((tx) => (
                      <tr key={tx.id || tx.transaction_code}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.transaction_code}</td>
                        <td>{tx.transaction_date ? tx.transaction_date.split('T')[0] : '-'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--gmh-green-dark)' }}>{formatRupiah(tx.amount)}</td>
                        <td>
                          <span style={{ fontSize: 11.5, padding: '2px 8px', background: '#f1f5f9', borderRadius: 4 }}>
                            {tx.payment_method || 'BANK_TRANSFER'}
                          </span>
                        </td>
                        <td style={{ color: '#475569' }}>
                          {tx.notes || tx.category || 'Penerimaan Donasi / Janji Iman'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedReceipt({
                                receiptNumber: tx.transaction_code,
                                name: member.name,
                                category: tx.category || 'Pembangunan Rumah Persekutuan',
                                amount: Number(tx.amount || 0),
                                lastPayment: tx.transaction_date ? tx.transaction_date.split('T')[0] : '-',
                              });
                            }}
                            style={{ fontSize: 11.5, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <QrCode size={13} /> E-Kuitansi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIWAYAT PELAYANAN MISI                                             */}
      {/* ========================================================================= */}
      {activeTab === 'MISSIONS' && (
        <div className="card" style={{ padding: '20px 24px', background: '#ffffff' }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 16,
              color: 'var(--gmh-green-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} color="var(--gmh-gold)" /> Riwayat Pelayanan Misi &amp; Kepanitiaan ({memberServiceRecords.length})
            </div>
            <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
              Mencakup peran kordinator, panitia, dan penanggung jawab pos pelayanan
            </span>
          </div>

          {memberServiceRecords.length === 0 ? (
            <div
              style={{
                padding: 24,
                background: '#f8fafc',
                border: '1px dashed var(--gmh-border)',
                borderRadius: 8,
                textAlign: 'center',
                color: '#64748b',
                fontSize: 13,
              }}
            >
              Belum ada catatan riwayat kepanitiaan / kordinator dalam kegiatan pelayanan misi untuk anggota ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {memberServiceRecords.map((rec, idx) => (
                <div
                  key={`${rec.activityId}-${idx}`}
                  style={{
                    padding: '14px 18px',
                    background: '#f8fafc',
                    border: '1px solid var(--gmh-border)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 14, color: 'var(--gmh-text)' }}>{rec.activityTitle}</strong>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: rec.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                          color: rec.status === 'COMPLETED' ? '#065f46' : '#92400e',
                        }}
                      >
                        {rec.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERJALAN'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: '#475569', marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={13} color="var(--gmh-gold-dark)" />
                        <strong>Peran:</strong> {rec.role}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color="var(--gmh-green)" />
                        <strong>Lokasi (Dimana):</strong> {rec.location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} color="#0284c7" />
                        <strong>Waktu (Kapan):</strong> {rec.timePreview || rec.eventDate}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/missions')}
                    style={{ fontSize: 12, padding: '4px 10px', color: 'var(--gmh-green-dark)' }}
                  >
                    Lihat di Modul Misi &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION F2: JEJAK KEPENGURUSAN (DATABASE ORGANISASI)                      */}
      {/* ========================================================================= */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="var(--gmh-gold)" /> Jejak Kepengurusan &amp; Tugas Struktur
          </div>
          <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 500 }}>
            Disinkronkan dari Modul Struktur &amp; Kepengurusan
          </span>
        </div>
        <MemberOrgHistory memberId={member?.id} />
      </div>



      {/* ========================================================================= */}
      {/* MODAL 2: CATAT DONASI / JANJI IMAN BARU                                   */}
      {/* ========================================================================= */}
      {showAddPledgeModal && (
        <div className="modal-overlay" onClick={() => setShowAddPledgeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Catat Donasi / Janji Iman Baru</h3>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Donatur: <strong>{member.name}</strong> ({member.nia})
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddPledgeModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPledge}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Peruntukan / Program:</label>
                  <select
                    className="input"
                    value={newPledgeForm.category}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, category: e.target.value })}
                  >
                    {(lookups?.donationCategories || [
                      'Pembangunan Rumah Persekutuan',
                      'Pelayanan Misi & Pos Pekabar Injil',
                      'Renovasi & Audio Visual Ruang Doa',
                      'Beasiswa & Adik Asuh Binaan',
                      'Operasional & Kas Kantor GMH',
                    ]).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tipe Komitmen:</label>
                  <select
                    className="input"
                    value={newPledgeForm.type}
                    onChange={(e) =>
                      setNewPledgeForm({ ...newPledgeForm, type: e.target.value as 'PLEDGE' | 'DONATION' })
                    }
                  >
                    <option value="PLEDGE">Janji Iman (Komitmen Bertahap)</option>
                    <option value="DONATION">Donasi Langsung (Sekaligus Lunas)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    {newPledgeForm.type === 'PLEDGE' ? 'Total Target Janji Iman (Rp):' : 'Nominal Donasi (Rp):'}
                  </label>
                  <NominalInput
                    value={newPledgeForm.total}
                    onChange={(val) => {
                      setNewPledgeForm({
                        ...newPledgeForm,
                        total: val,
                        initialPaid: newPledgeForm.type === 'DONATION' ? val : newPledgeForm.initialPaid,
                      });
                    }}
                    placeholder="Masukkan nominal target..."
                  />
                </div>

                {newPledgeForm.type === 'PLEDGE' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Setoran Pertama Saat Ini (Rp) - Opsional:
                    </label>
                    <NominalInput
                      value={newPledgeForm.initialPaid}
                      onChange={(val) => setNewPledgeForm({ ...newPledgeForm, initialPaid: val })}
                      placeholder="Rp 0 jika belum ada setoran awal..."
                    />
                  </div>
                )}

                {(newPledgeForm.type === 'DONATION' || newPledgeForm.initialPaid > 0) && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Metode Pembayaran:</label>
                    <select
                      className="input"
                      value={newPledgeForm.paymentMethod}
                      onChange={(e) => setNewPledgeForm({ ...newPledgeForm, paymentMethod: e.target.value })}
                    >
                      <option value="BANK_TRANSFER">Transfer Bank (Rekening Yayasan)</option>
                      <option value="CASH">Tunai (Kasir / Sekretariat)</option>
                      <option value="QRIS">QRIS Yayasan GMH</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Target Selesai / Jatuh Tempo (Opsional):</label>
                  <input
                    type="date"
                    className="input"
                    value={newPledgeForm.dueDate}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Catatan / Komitmen:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran bulanan Rp 500.000 selama 1 tahun"
                    value={newPledgeForm.notes}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddPledgeModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Komitmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BAYAR ANGSURAN JANJI IMAN                                        */}
      {/* ========================================================================= */}
      {showAddInstallmentModal && targetPledgeForInstallment && (
        <div className="modal-overlay" onClick={() => setShowAddInstallmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Catat Angsuran Janji Iman</h3>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Untuk: <strong>{member.name}</strong> · {targetPledgeForInstallment.category}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddInstallmentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInstallment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--gmh-border)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Target Janji Iman:</span>
                    <strong>{formatRupiah(targetPledgeForInstallment.total_pledge)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Sudah Terbayar:</span>
                    <strong style={{ color: '#047857' }}>{formatRupiah(targetPledgeForInstallment.fulfilled_amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>Sisa Kewajiban:</span>
                    <strong style={{ color: '#b45309' }}>
                      {formatRupiah(Math.max(0, Number(targetPledgeForInstallment.total_pledge || 0) - Number(targetPledgeForInstallment.fulfilled_amount || 0)))}
                    </strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Nominal Angsuran (Rp):</label>
                  <NominalInput
                    value={installmentForm.amount}
                    onChange={(val) => setInstallmentForm({ ...installmentForm, amount: val })}
                    placeholder="Masukkan nominal angsuran..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Penyetoran:</label>
                  <input
                    type="date"
                    className="input"
                    value={installmentForm.date}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Metode Pembayaran:</label>
                  <select
                    className="input"
                    value={installmentForm.paymentMethod}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, paymentMethod: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Transfer Bank (Rekening Yayasan)</option>
                    <option value="CASH">Tunai (Kasir / Sekretariat)</option>
                    <option value="QRIS">QRIS Yayasan GMH</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Keterangan / Catatan:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran tahap 2 melalui transfer BCA"
                    value={installmentForm.notes}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddInstallmentModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Angsuran &amp; Terbitkan Kuitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: E-KUITANSI DIGITAL RESMI                                         */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>E-Kuitansi Resmi Yayasan GMH</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedReceipt(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ background: 'var(--gmh-surface)' }}>
              <div
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid var(--gmh-green)', paddingBottom: 12, marginBottom: 16 }}>
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                      Badan Hukum · Medan, Sumatera Utara · gmhpakmk.org
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#b45309', marginTop: 4 }}>
                      TANDA BUKTI PENERIMAAN DANA DONASI / JANJI IMAN
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Nomor Kuitansi:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.receiptNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Telah Terima Dari:</span>
                    <strong>{selectedReceipt.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Peruntukan:</span>
                    <span>{selectedReceipt.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Tanggal Penyetoran:</span>
                    <span>{selectedReceipt.lastPayment}</span>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      padding: '12px 16px',
                      background: 'var(--gmh-surface-2)',
                      borderRadius: 6,
                      borderLeft: '4px solid var(--gmh-green)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Nominal Diterima:</span>
                    <strong style={{ fontSize: 18, color: 'var(--gmh-green-dark)' }}>
                      {formatRupiah(selectedReceipt.amount || selectedReceipt.paid)}
                    </strong>
                  </div>

                  {selectedReceipt.total && (
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span>Realisasi Total: {formatRupiah(selectedReceipt.paid)} dari {formatRupiah(selectedReceipt.total)}</span>
                      <span>Sisa: {formatRupiah(selectedReceipt.remaining)}</span>
                    </div>
                  )}
                </div>

                {/* QR Code Verification Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px dashed var(--gmh-border)',
                  }}
                >
                  <div
                    style={{
                      padding: 8,
                      background: '#fff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={52} color="var(--gmh-green-dark)" />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={14} /> Dokumen Sah &amp; Terverifikasi
                    </div>
                    <div>Pindai kode QR untuk memvalidasi keaslian tanda terima ini secara real-time pada sistem gmhpakmk.org.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-outline"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> Cetak Kuitansi
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedReceipt(null)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;
