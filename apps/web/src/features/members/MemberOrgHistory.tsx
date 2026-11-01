import React from 'react';
import { Globe, ShieldCheck, Briefcase, Layers, Calendar } from 'lucide-react';
import { useMemberOrgProfile, normalizeOrgStatus, formatOrgDate } from '../../hooks/useMemberOrgProfile';

interface Props {
  memberId?: string | null;
  accent?: string;
}

/**
 * Riwayat kepengurusan anggota — 100% dari database (tabel committee_records,
 * org_position_tenures, staff_members, division_members). Tidak ada data mock.
 */
const MemberOrgHistory: React.FC<Props> = ({ memberId }) => {
  const { profile, loading, error } = useMemberOrgProfile(memberId);

  const total =
    profile.committees.length +
    profile.positions.length +
    profile.staff.length +
    profile.divisions.length;

  if (loading) {
    return (
      <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12.5, color: '#64748b', textAlign: 'center' }}>
        Memuat data kepengurusan anggota dari database...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: 6, fontSize: 12.5, color: '#b91c1c', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12.5, color: '#64748b', textAlign: 'center' }}>
        Belum ada catatan kepanitiaan, jabatan struktur, staf, atau keanggotaan divisi untuk anggota ini.
      </div>
    );
  }

  const badge = (active: boolean, activeLabel = 'Aktif', inactiveLabel = 'Riwayat Lampau') => (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 4,
        background: active ? '#ecfdf5' : '#f1f5f9',
        color: active ? '#065f46' : '#475569',
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );

  const row = (icon: React.ReactNode, title: string, subtitle: string, meta: string, active: boolean, description?: string) => (
    <div
      key={`${title}-${subtitle}-${meta}`}
      style={{
        padding: '10px 14px',
        background: '#ffffff',
        border: '1px solid var(--gmh-border, #e2e8f0)',
        borderRadius: 6,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {icon}
          <strong style={{ fontSize: 13, color: 'var(--gmh-text, #0f172a)' }}>{title}</strong>
          {badge(active)}
        </div>
        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>{subtitle}</div>
        {description && (
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3, fontStyle: 'italic' }}>{description}</div>
        )}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#475569' }}>
        <Calendar size={12} color="#0284c7" />
        <span>{meta}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {profile.committees.map((c) =>
        row(
          <Globe size={14} color="var(--gmh-gold, #b8860b)" />,
          c.committee_name,
          c.role_title,
          c.period || (c.event_year ? String(c.event_year) : formatOrgDate(c.created_at)),
          normalizeOrgStatus(c.status) === 'AKTIF',
          c.description
        )
      )}

      {profile.positions.map((p) =>
        row(
          <ShieldCheck size={14} color="#047857" />,
          p.position_title,
          `${p.position_category || 'STRUKTUR'}${p.decree_number ? ` · No. SK: ${p.decree_number}` : ''}`,
          p.period || formatOrgDate(p.start_date),
          !!p.is_current,
          p.notes
        )
      )}

      {profile.staff.map((s) =>
        row(
          <Briefcase size={14} color="#1d4ed8" />,
          s.position_title,
          `${s.department_name || 'Departemen Yayasan'} · ${s.employment_type}`,
          s.joined_date ? formatOrgDate(s.joined_date) : '-',
          !!s.is_active && normalizeOrgStatus(s.status) === 'AKTIF',
          s.job_description
        )
      )}

      {profile.divisions.map((d) =>
        row(
          <Layers size={14} color="#7c2d12" />,
          d.division_name,
          d.role_title,
          d.period || formatOrgDate(d.start_date),
          normalizeOrgStatus(d.status) === 'AKTIF',
          d.notes
        )
      )}
    </div>
  );
};

export default MemberOrgHistory;
