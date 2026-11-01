import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Jejak kepengurusan seorang anggota, diambil langsung dari database.
 * Sumber: committee_records, org_position_tenures, staff_members, division_members.
 */
export interface MemberCommitteeRecord {
  id: string;
  committee_name: string;
  role_title: string;
  event_year?: number;
  period?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  description?: string;
  created_at?: string;
}

export interface MemberPositionRecord {
  id: string;
  position_id: string;
  position_title: string;
  position_code?: string;
  position_category?: string;
  period: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  decree_number?: string;
  notes?: string;
}

export interface MemberStaffRecord {
  id: string;
  department_id?: string;
  department_name?: string;
  position_title: string;
  employment_type: string;
  joined_date?: string;
  end_date?: string;
  status?: string;
  job_description?: string;
  is_active: boolean;
}

export interface MemberDivisionRecord {
  id: string;
  department_id: string;
  division_name: string;
  role_title: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
}

export interface MemberOrgProfile {
  member: any | null;
  committees: MemberCommitteeRecord[];
  positions: MemberPositionRecord[];
  staff: MemberStaffRecord[];
  divisions: MemberDivisionRecord[];
}

const EMPTY: MemberOrgProfile = {
  member: null,
  committees: [],
  positions: [],
  staff: [],
  divisions: [],
};

export const useMemberOrgProfile = (memberId?: string | null) => {
  const [profile, setProfile] = useState<MemberOrgProfile>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.organization.getMemberProfile(id);
      if (res?.success) {
        setProfile({
          member: res.member || null,
          committees: res.committees || [],
          positions: res.positions || [],
          staff: res.staff || [],
          divisions: res.divisions || [],
        });
      } else {
        setProfile(EMPTY);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data kepengurusan anggota.');
      setProfile(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!memberId) {
      setProfile(EMPTY);
      return;
    }
    void load(memberId);
  }, [memberId, load]);

  return {
    profile,
    loading,
    error,
    reload: () => (memberId ? load(memberId) : Promise.resolve()),
  };
};

/** Status memakai kode Indonesia; database dinormalisasi ke kode yang sama. */
export const normalizeOrgStatus = (value?: string | null): 'AKTIF' | 'SELESAI' | 'DEMISIONER' => {
  const v = String(value || '').toUpperCase();
  if (v === 'ACTIVE' || v === 'AKTIF') return 'AKTIF';
  if (v === 'DEMISSIONER' || v === 'DEMISIONER') return 'DEMISIONER';
  return 'SELESAI';
};

export const formatOrgDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
};
