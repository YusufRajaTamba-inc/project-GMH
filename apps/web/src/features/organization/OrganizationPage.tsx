import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Briefcase,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { usePagination } from '../../utils/usePagination';
import type {
  LookupMember,
  CommitteeRecord,
  OrgPosition,
  OrgTenure,
  StaffMember,
  Division,
  DivisionMember,
  CommitteeFormState,
  PositionFormState,
  TenureFormState,
  StaffFormState,
  DivisionFormState,
  DivisionMemberFormState,
} from './types';
import { OrganizationCommitteesTab } from './components/OrganizationCommitteesTab';
import { OrganizationPositionsTab } from './components/OrganizationPositionsTab';
import { OrganizationStaffTab } from './components/OrganizationStaffTab';
import { OrganizationDivisionsTab } from './components/OrganizationDivisionsTab';
import {
  CommitteeModal,
  PositionModal,
  AssignTenureModal,
  PositionHistoryModal,
  StaffModal,
  DivisionModal,
  DivisionMembersModal,
  AddDivisionMemberModal,
} from './components/OrganizationModals';

export const OrganizationPage: React.FC = () => {
  // Tabs: committees, positions, staff, divisions
  const [activeTab, setActiveTab] = useState<'committees' | 'positions' | 'staff' | 'divisions'>('committees');

  // Stats
  const [stats, setStats] = useState({
    totalCommittees: 0,
    totalPositions: 0,
    totalStaff: 0,
    totalDivisions: 0,
  });

  // Global Member search lookup cache
  const [memberOptions, setMemberOptions] = useState<LookupMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --------------------------------------------------------------------------
  // Tab 1: Committees State
  // --------------------------------------------------------------------------
  const [committees, setCommittees] = useState<CommitteeRecord[]>([]);
  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [committeeSearch, setCommitteeSearch] = useState('');
  const [committeeFilterStatus, setCommitteeFilterStatus] = useState('ALL');
  const [committeeModalOpen, setCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<CommitteeRecord | null>(null);
  const [committeeForm, setCommitteeForm] = useState<CommitteeFormState>({
    member_id: '',
    committee_name: '',
    role_title: '',
    event_year: new Date().getFullYear(),
    period: String(new Date().getFullYear()),
    start_date: '',
    end_date: '',
    status: 'AKTIF',
    description: '',
  });

  // --------------------------------------------------------------------------
  // Tab 2: Positions State
  // --------------------------------------------------------------------------
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<OrgPosition | null>(null);
  const [positionForm, setPositionForm] = useState<PositionFormState>({
    position_code: '',
    title: '',
    category: 'PENGURUS_HARIAN',
    function_description: '',
    hierarchy_order: 1,
  });

  // Position Tenures (History of position)
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPositionForHistory, setSelectedPositionForHistory] = useState<OrgPosition | null>(null);
  const [positionTenures, setPositionTenures] = useState<OrgTenure[]>([]);
  const [loadingTenures, setLoadingTenures] = useState(false);

  // Assign tenure modal
  const [assignTenureModalOpen, setAssignTenureModalOpen] = useState(false);
  const [tenureForm, setTenureForm] = useState<TenureFormState>({
    member_id: '',
    period: '2024 - 2027',
    start_date: '',
    end_date: '',
    is_current: true,
    decree_number: '',
    notes: '',
  });

  // --------------------------------------------------------------------------
  // Tab 3: Staff State
  // --------------------------------------------------------------------------
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    member_id: '',
    department_id: '',
    position_title: '',
    employment_type: 'FULL_TIME',
    joined_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'AKTIF',
    job_description: '',
    is_active: true,
  });

  // --------------------------------------------------------------------------
  // Tab 4: Divisions State
  // --------------------------------------------------------------------------
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [divisionModalOpen, setDivisionModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [divisionForm, setDivisionForm] = useState<DivisionFormState>({
    id: '',
    name: '',
    description: '',
    head_member_id: '',
    order_index: 0,
  });

  // Division Detail / Members Modal
  const [divisionMembersModalOpen, setDivisionMembersModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionMembers, setDivisionMembers] = useState<DivisionMember[]>([]);
  const [loadingDivisionMembers, setLoadingDivisionMembers] = useState(false);
  const [divisionMemberFilterStatus, setDivisionMemberFilterStatus] = useState('ALL');

  // Add member to division form
  const [addDivisionMemberModalOpen, setAddDivisionMemberModalOpen] = useState(false);
  const [divisionMemberForm, setDivisionMemberForm] = useState<DivisionMemberFormState>({
    member_id: '',
    role_title: 'Anggota Divisi',
    period: '2024 - Sekarang',
    start_date: '',
    end_date: '',
    status: 'AKTIF',
    notes: '',
  });

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const loadStats = useCallback(async () => {
    try {
      const res = await api.organization.getStats();
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  const searchMembers = useCallback(async (q: string) => {
    try {
      const res = await api.organization.lookupMembers(q);
      if (res.success) setMemberOptions(res.members || []);
    } catch (err) {
      console.error('Failed to lookup members', err);
    }
  }, []);

  const loadCommittees = useCallback(async () => {
    setLoadingCommittees(true);
    try {
      const res = await api.organization.getCommittees({
        search: committeeSearch,
        status: committeeFilterStatus,
      });
      if (res.success) setCommittees(res.committees || []);
    } catch (err: any) {
      showToast('error', 'Gagal memuat record kepanitiaan: ' + err.message);
    } finally {
      setLoadingCommittees(false);
    }
  }, [committeeSearch, committeeFilterStatus]);

  const loadPositions = useCallback(async () => {
    setLoadingPositions(true);
    try {
      const res = await api.organization.getPositions();
      if (res.success) setPositions(res.positions || []);
    } catch (err: any) {
      showToast('error', 'Gagal memuat susunan kepengurusan: ' + err.message);
    } finally {
      setLoadingPositions(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await api.organization.getStaff({ search: staffSearch });
      if (res.success) setStaffList(res.staff || []);
    } catch (err: any) {
      showToast('error', 'Gagal memuat daftar staf: ' + err.message);
    } finally {
      setLoadingStaff(false);
    }
  }, [staffSearch]);

  const loadDivisions = useCallback(async () => {
    setLoadingDivisions(true);
    try {
      const res = await api.organization.getDivisions();
      if (res.success) setDivisions(res.divisions || []);
    } catch (err: any) {
      showToast('error', 'Gagal memuat daftar divisi: ' + err.message);
    } finally {
      setLoadingDivisions(false);
    }
  }, []);

  const loadPositionTenures = useCallback(async (posId: string) => {
    setLoadingTenures(true);
    try {
      const res = await api.organization.getPositionTenures(posId);
      if (res.success) setPositionTenures(res.tenures || []);
    } catch (err: any) {
      showToast('error', 'Gagal memuat riwayat pejabat: ' + err.message);
    } finally {
      setLoadingTenures(false);
    }
  }, []);

  const loadDivisionMembers = useCallback(async (divId: string, status?: string) => {
    setLoadingDivisionMembers(true);
    try {
      const res = await api.organization.getDivisionMembers(divId, status || divisionMemberFilterStatus);
      if (res.success) setDivisionMembers(res.members || []);
    } catch (err: any) {
      showToast('error', 'Gagal memuat anggota divisi: ' + err.message);
    } finally {
      setLoadingDivisionMembers(false);
    }
  }, [divisionMemberFilterStatus]);

  // Initial load: load stats, search lookup cache, and preload all tabs data
  useEffect(() => {
    void loadStats();
    void searchMembers('');
    void loadCommittees();
    void loadPositions();
    void loadStaff();
    void loadDivisions();
  }, [loadStats, searchMembers, loadCommittees, loadPositions, loadStaff, loadDivisions]);

  useEffect(() => {
    if (activeTab === 'committees') void loadCommittees();
    else if (activeTab === 'positions') void loadPositions();
    else if (activeTab === 'staff') void loadStaff();
    else if (activeTab === 'divisions') void loadDivisions();
  }, [activeTab, loadCommittees, loadPositions, loadStaff, loadDivisions]);

  // Pagination for committees
  const {
    currentPage: committeePage,
    setCurrentPage: setCommitteePage,
    pageSize: committeePageSize,
    setPageSize: setCommitteePageSize,
    totalPages: committeeTotalPages,
    paginatedItems: paginatedCommittees,
  } = usePagination(committees, { initialPageSize: 10 });

  // --------------------------------------------------------------------------
  // Tab 1: Committees Handlers
  // --------------------------------------------------------------------------
  const openNewCommitteeModal = () => {
    setEditingCommittee(null);
    setMemberSearchQuery('');
    setCommitteeForm({
      member_id: '',
      committee_name: '',
      role_title: '',
      event_year: new Date().getFullYear(),
      period: String(new Date().getFullYear()),
      start_date: '',
      end_date: '',
      status: 'AKTIF',
      description: '',
    });
    setCommitteeModalOpen(true);
  };

  const openEditCommitteeModal = (c: CommitteeRecord) => {
    setEditingCommittee(c);
    if (c.member_id && c.member_name) {
      setMemberOptions((prev) => {
        if (prev.some((m) => m.id === c.member_id)) return prev;
        return [
          {
            id: c.member_id,
            member_number: c.member_number,
            full_name: c.member_name,
            faculty: c.faculty,
            graduation_year: c.graduation_year,
            phone_number: c.phone_number,
            email: c.email,
          },
          ...prev,
        ];
      });
    }
    setCommitteeForm({
      member_id: c.member_id,
      committee_name: c.committee_name,
      role_title: c.role_title,
      event_year: c.event_year || new Date().getFullYear(),
      period: c.period || '',
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      status: c.status === 'SELESAI' ? 'SELESAI' : 'AKTIF',
      description: c.description || '',
    });
    setCommitteeModalOpen(true);
  };

  const saveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeForm.member_id || !committeeForm.committee_name || !committeeForm.role_title) {
      showToast('error', 'Pilih anggota, isi nama kepanitiaan, dan posisi.');
      return;
    }
    try {
      if (editingCommittee) {
        await api.organization.updateCommittee(editingCommittee.id, committeeForm);
        showToast('success', 'Record kepanitiaan berhasil diperbarui.');
      } else {
        await api.organization.createCommittee(committeeForm);
        showToast('success', 'Record kepanitiaan berhasil dicatat.');
      }
      setCommitteeModalOpen(false);
      void loadCommittees();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan kepanitiaan.');
    }
  };

  const deleteCommittee = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus record kepanitiaan ini?')) return;
    try {
      await api.organization.deleteCommittee(id);
      showToast('success', 'Record kepanitiaan berhasil dihapus.');
      void loadCommittees();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus.');
    }
  };

  // --------------------------------------------------------------------------
  // Tab 2: Positions Handlers
  // --------------------------------------------------------------------------
  const openNewPositionModal = () => {
    setEditingPosition(null);
    setPositionForm({
      position_code: '',
      title: '',
      category: 'PENGURUS_HARIAN',
      function_description: '',
      hierarchy_order: positions.length + 1,
    });
    setPositionModalOpen(true);
  };

  const openEditPositionModal = (p: OrgPosition) => {
    setEditingPosition(p);
    setPositionForm({
      position_code: p.position_code,
      title: p.title,
      category: p.category,
      function_description: p.function_description || '',
      hierarchy_order: p.hierarchy_order,
    });
    setPositionModalOpen(true);
  };

  const savePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionForm.title) {
      showToast('error', 'Nama jabatan wajib diisi.');
      return;
    }
    try {
      if (editingPosition) {
        await api.organization.updatePosition(editingPosition.id, positionForm);
        showToast('success', 'Jabatan kepengurusan berhasil diperbarui.');
      } else {
        await api.organization.createPosition(positionForm);
        showToast('success', 'Jabatan kepengurusan baru berhasil ditambahkan.');
      }
      setPositionModalOpen(false);
      void loadPositions();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan jabatan.');
    }
  };

  const deletePosition = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus jabatan ini beserta riwayatnya?')) return;
    try {
      await api.organization.deletePosition(id);
      showToast('success', 'Jabatan kepengurusan berhasil dihapus.');
      void loadPositions();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus jabatan.');
    }
  };

  const openHistoryModal = (p: OrgPosition) => {
    setSelectedPositionForHistory(p);
    setHistoryModalOpen(true);
    void loadPositionTenures(p.id);
  };

  const openAssignTenureModal = (p: OrgPosition) => {
    setSelectedPositionForHistory(p);
    if (p.current_member_id && p.current_member_name) {
      setMemberOptions((prev) => {
        if (prev.some((m) => m.id === p.current_member_id)) return prev;
        return [
          {
            id: p.current_member_id!,
            member_number: p.current_member_number || '',
            full_name: p.current_member_name!,
            faculty: p.current_member_faculty,
            graduation_year: p.current_member_graduation_year,
            phone_number: p.current_member_phone,
            email: p.current_member_email,
          },
          ...prev,
        ];
      });
    }
    setMemberSearchQuery('');
    setTenureForm({
      member_id: p.current_member_id || '',
      period: p.current_period || '2024 - 2027',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_current: true,
      decree_number: '',
      notes: '',
    });
    setAssignTenureModalOpen(true);
  };

  const saveTenure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPositionForHistory || !tenureForm.member_id || !tenureForm.period) {
      showToast('error', 'Pilih anggota dan isi periode masa jabatan.');
      return;
    }
    try {
      await api.organization.addTenure(selectedPositionForHistory.id, tenureForm);
      showToast('success', 'Pejabat posisi berhasil dicatat ke dalam database.');
      setAssignTenureModalOpen(false);
      void loadPositions();
      if (historyModalOpen) void loadPositionTenures(selectedPositionForHistory.id);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mencatat pejabat.');
    }
  };

  const deleteTenure = async (tenureId: string) => {
    if (!window.confirm('Hapus riwayat pejabat ini?')) return;
    try {
      await api.organization.deleteTenure(tenureId);
      showToast('success', 'Riwayat pejabat dihapus.');
      if (selectedPositionForHistory) void loadPositionTenures(selectedPositionForHistory.id);
      void loadPositions();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus riwayat.');
    }
  };

  // --------------------------------------------------------------------------
  // Tab 3: Staff Handlers
  // --------------------------------------------------------------------------
  const openNewStaffModal = () => {
    setEditingStaff(null);
    setMemberSearchQuery('');
    setStaffForm({
      member_id: '',
      department_id: divisions[0]?.id || '',
      position_title: '',
      employment_type: 'FULL_TIME',
      joined_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'AKTIF',
      job_description: '',
      is_active: true,
    });
    setStaffModalOpen(true);
  };

  const openEditStaffModal = (s: StaffMember) => {
    setEditingStaff(s);
    if (s.member_id && s.member_name) {
      setMemberOptions((prev) => {
        if (prev.some((m) => m.id === s.member_id)) return prev;
        return [
          {
            id: s.member_id,
            member_number: s.member_number,
            full_name: s.member_name,
            faculty: s.faculty,
            graduation_year: s.graduation_year,
            phone_number: s.phone_number,
            email: s.email,
          },
          ...prev,
        ];
      });
    }
    setStaffForm({
      member_id: s.member_id,
      department_id: s.department_id || '',
      position_title: s.position_title,
      employment_type: s.employment_type || 'FULL_TIME',
      joined_date: s.joined_date ? s.joined_date.split('T')[0] : '',
      end_date: s.end_date ? s.end_date.split('T')[0] : '',
      status: s.status || 'AKTIF',
      job_description: s.job_description || '',
      is_active: s.is_active,
    });
    setStaffModalOpen(true);
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.member_id || !staffForm.position_title) {
      showToast('error', 'Pilih anggota dan isi posisi/jabatan staf.');
      return;
    }
    try {
      if (editingStaff) {
        await api.organization.updateStaff(editingStaff.id, staffForm);
        showToast('success', 'Data staf berhasil diperbarui.');
      } else {
        await api.organization.createStaff(staffForm);
        showToast('success', 'Staf penuh waktu baru berhasil ditambahkan.');
      }
      setStaffModalOpen(false);
      void loadStaff();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan data staf.');
    }
  };

  const deleteStaff = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data staf penuh waktu ini?')) return;
    try {
      await api.organization.deleteStaff(id);
      showToast('success', 'Data staf berhasil dihapus.');
      void loadStaff();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus.');
    }
  };

  // --------------------------------------------------------------------------
  // Tab 4: Division Handlers
  // --------------------------------------------------------------------------
  const openNewDivisionModal = () => {
    setEditingDivision(null);
    setDivisionForm({
      id: '',
      name: '',
      description: '',
      head_member_id: '',
      order_index: divisions.length + 1,
    });
    setDivisionModalOpen(true);
  };

  const openEditDivisionModal = (d: Division) => {
    setEditingDivision(d);
    setDivisionForm({
      id: d.id,
      name: d.name,
      description: d.description || '',
      head_member_id: d.head_member_id || '',
      order_index: d.order_index || 0,
    });
    setDivisionModalOpen(true);
  };

  const saveDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionForm.name) {
      showToast('error', 'Nama divisi wajib diisi.');
      return;
    }
    try {
      if (editingDivision) {
        await api.organization.updateDivision(editingDivision.id, divisionForm);
        showToast('success', 'Divisi berhasil diperbarui.');
      } else {
        await api.organization.createDivision(divisionForm);
        showToast('success', 'Divisi baru berhasil dibuat.');
      }
      setDivisionModalOpen(false);
      void loadDivisions();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan divisi.');
    }
  };

  const deleteDivision = async (id: string) => {
    if (!window.confirm('Hapus divisi ini beserta seluruh riwayat anggotanya?')) return;
    try {
      await api.organization.deleteDivision(id);
      showToast('success', 'Divisi berhasil dihapus.');
      void loadDivisions();
      void loadStats();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus divisi.');
    }
  };

  const openDivisionMembersModal = (d: Division) => {
    setSelectedDivision(d);
    setDivisionMembersModalOpen(true);
    void loadDivisionMembers(d.id, 'ALL');
  };

  const openAddDivisionMemberModal = (d: Division) => {
    setSelectedDivision(d);
    setMemberSearchQuery('');
    setDivisionMemberForm({
      member_id: '',
      role_title: 'Anggota Divisi',
      period: '2024 - Sekarang',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'AKTIF',
      notes: '',
    });
    setAddDivisionMemberModalOpen(true);
  };

  const saveDivisionMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDivision || !divisionMemberForm.member_id || !divisionMemberForm.role_title) {
      showToast('error', 'Pilih anggota dan peran dalam divisi.');
      return;
    }
    try {
      await api.organization.addDivisionMember(selectedDivision.id, divisionMemberForm);
      showToast('success', 'Anggota berhasil ditugaskan ke divisi.');
      setAddDivisionMemberModalOpen(false);
      void loadDivisionMembers(selectedDivision.id);
      void loadDivisions();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambahkan anggota.');
    }
  };

  const deleteDivisionMember = async (assignmentId: string) => {
    if (!window.confirm('Hapus penugasan anggota ini?')) return;
    try {
      await api.organization.deleteDivisionMember(assignmentId);
      showToast('success', 'Penugasan anggota dihapus.');
      if (selectedDivision) void loadDivisionMembers(selectedDivision.id);
      void loadDivisions();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus.');
    }
  };

  // Group positions by category for rich leadership display
  const categorizedPositions = useMemo(() => {
    const map: Record<string, OrgPosition[]> = {
      DEWAN_PEMBINA: [],
      DEWAN_PENGAWAS: [],
      PENGURUS_HARIAN: [],
      LAINNYA: [],
    };
    positions.forEach((p) => {
      if (p.category === 'DEWAN_PEMBINA') map.DEWAN_PEMBINA.push(p);
      else if (p.category === 'DEWAN_PENGAWAS') map.DEWAN_PENGAWAS.push(p);
      else if (p.category === 'PENGURUS_HARIAN') map.PENGURUS_HARIAN.push(p);
      else map.LAINNYA.push(p);
    });
    return map;
  }, [positions]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 18 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
            background: toastMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${toastMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <section className="org-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 280px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#047857',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Award size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 750, color: '#0f172a', wordBreak: 'break-word' }}>
              Struktur & Kepengurusan Yayasan
            </h1>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13, wordBreak: 'break-word' }}>
              Direktori kepanitiaan anggota, susunan pengurus inti, staf penuh waktu, dan divisi pelayanan GMH PA KMK
            </p>
          </div>
        </div>

        {/* 4 Summary KPI counters */}
        <div className="org-kpi-grid">
          <div className="org-kpi-card">
            <div className="org-kpi-label">Kepanitiaan</div>
            <div className="org-kpi-value" style={{ color: '#0f172a' }}>{stats.totalCommittees}</div>
          </div>
          <div className="org-kpi-card">
            <div className="org-kpi-label">Jabatan Inti</div>
            <div className="org-kpi-value" style={{ color: '#047857' }}>{stats.totalPositions}</div>
          </div>
          <div className="org-kpi-card">
            <div className="org-kpi-label">Staf Full-Time</div>
            <div className="org-kpi-value" style={{ color: '#0369a1' }}>{stats.totalStaff}</div>
          </div>
          <div className="org-kpi-card">
            <div className="org-kpi-label">Divisi Pelayanan</div>
            <div className="org-kpi-value" style={{ color: '#b45309' }}>{stats.totalDivisions}</div>
          </div>
        </div>
      </section>

      {/* Modern Sub-Tab Navigation Bar */}
      <div className="org-tab-bar">
        <button
          type="button"
          onClick={() => setActiveTab('committees')}
          className="org-tab-btn"
          style={{
            fontWeight: activeTab === 'committees' ? 700 : 500,
            background: activeTab === 'committees' ? '#ffffff' : 'transparent',
            color: activeTab === 'committees' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'committees' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
          }}
        >
          <Calendar size={15} color={activeTab === 'committees' ? '#047857' : '#94a3b8'} />
          <span>1. Riwayat Kepanitiaan</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'committees' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'committees' ? '#047857' : '#64748b' }}>
            {stats.totalCommittees || committees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          className="org-tab-btn"
          style={{
            fontWeight: activeTab === 'positions' ? 700 : 500,
            background: activeTab === 'positions' ? '#ffffff' : 'transparent',
            color: activeTab === 'positions' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'positions' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
          }}
        >
          <ShieldCheck size={15} color={activeTab === 'positions' ? '#047857' : '#94a3b8'} />
          <span>2. Pengurus Inti Yayasan</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'positions' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'positions' ? '#047857' : '#64748b' }}>
            {stats.totalPositions || positions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className="org-tab-btn"
          style={{
            fontWeight: activeTab === 'staff' ? 700 : 500,
            background: activeTab === 'staff' ? '#ffffff' : 'transparent',
            color: activeTab === 'staff' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'staff' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
          }}
        >
          <Briefcase size={15} color={activeTab === 'staff' ? '#047857' : '#94a3b8'} />
          <span>3. Staf Full-Time</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'staff' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'staff' ? '#047857' : '#64748b' }}>
            {stats.totalStaff || staffList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('divisions')}
          className="org-tab-btn"
          style={{
            fontWeight: activeTab === 'divisions' ? 700 : 500,
            background: activeTab === 'divisions' ? '#ffffff' : 'transparent',
            color: activeTab === 'divisions' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'divisions' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
          }}
        >
          <Layers size={15} color={activeTab === 'divisions' ? '#047857' : '#94a3b8'} />
          <span>4. Divisi & Departemen</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'divisions' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'divisions' ? '#047857' : '#64748b' }}>
            {stats.totalDivisions || divisions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RIWAYAT KEPANITIAAN */}
      {activeTab === 'committees' && (
        <OrganizationCommitteesTab
          committees={committees}
          paginatedCommittees={paginatedCommittees}
          loadingCommittees={loadingCommittees}
          committeeSearch={committeeSearch}
          setCommitteeSearch={setCommitteeSearch}
          committeeFilterStatus={committeeFilterStatus}
          setCommitteeFilterStatus={setCommitteeFilterStatus}
          committeePage={committeePage}
          setCommitteePage={setCommitteePage}
          committeePageSize={committeePageSize}
          setCommitteePageSize={setCommitteePageSize}
          committeeTotalPages={committeeTotalPages}
          openNewCommitteeModal={openNewCommitteeModal}
          openEditCommitteeModal={openEditCommitteeModal}
          deleteCommittee={deleteCommittee}
        />
      )}

      {/* TAB 2: PENGURUS INTI YAYASAN */}
      {activeTab === 'positions' && (
        <OrganizationPositionsTab
          categorizedPositions={categorizedPositions}
          loadingPositions={loadingPositions}
          openNewPositionModal={openNewPositionModal}
          openEditPositionModal={openEditPositionModal}
          deletePosition={deletePosition}
          openHistoryModal={openHistoryModal}
          openAssignTenureModal={openAssignTenureModal}
        />
      )}

      {/* TAB 3: STAF FULL-TIME */}
      {activeTab === 'staff' && (
        <OrganizationStaffTab
          staffList={staffList}
          loadingStaff={loadingStaff}
          staffSearch={staffSearch}
          setStaffSearch={setStaffSearch}
          openNewStaffModal={openNewStaffModal}
          openEditStaffModal={openEditStaffModal}
          deleteStaff={deleteStaff}
        />
      )}

      {/* TAB 4: DIVISI & DEPARTEMEN */}
      {activeTab === 'divisions' && (
        <OrganizationDivisionsTab
          divisions={divisions}
          loadingDivisions={loadingDivisions}
          openNewDivisionModal={openNewDivisionModal}
          openEditDivisionModal={openEditDivisionModal}
          deleteDivision={deleteDivision}
          openDivisionMembersModal={openDivisionMembersModal}
          openAddDivisionMemberModal={openAddDivisionMemberModal}
        />
      )}

      {/* MODALS */}
      <CommitteeModal
        isOpen={committeeModalOpen}
        onClose={() => setCommitteeModalOpen(false)}
        editingCommittee={editingCommittee}
        committeeForm={committeeForm}
        setCommitteeForm={setCommitteeForm}
        saveCommittee={saveCommittee}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        searchMembers={searchMembers}
        memberOptions={memberOptions}
      />

      <PositionModal
        isOpen={positionModalOpen}
        onClose={() => setPositionModalOpen(false)}
        editingPosition={editingPosition}
        positionForm={positionForm}
        setPositionForm={setPositionForm}
        savePosition={savePosition}
      />

      <AssignTenureModal
        isOpen={assignTenureModalOpen}
        onClose={() => setAssignTenureModalOpen(false)}
        selectedPositionForHistory={selectedPositionForHistory}
        tenureForm={tenureForm}
        setTenureForm={setTenureForm}
        saveTenure={saveTenure}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        searchMembers={searchMembers}
        memberOptions={memberOptions}
      />

      <PositionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        selectedPositionForHistory={selectedPositionForHistory}
        loadingTenures={loadingTenures}
        positionTenures={positionTenures}
        deleteTenure={deleteTenure}
        openAssignTenureModal={() => setAssignTenureModalOpen(true)}
      />

      <StaffModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        editingStaff={editingStaff}
        staffForm={staffForm}
        setStaffForm={setStaffForm}
        saveStaff={saveStaff}
        divisions={divisions}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        searchMembers={searchMembers}
        memberOptions={memberOptions}
      />

      <DivisionModal
        isOpen={divisionModalOpen}
        onClose={() => setDivisionModalOpen(false)}
        editingDivision={editingDivision}
        divisionForm={divisionForm}
        setDivisionForm={setDivisionForm}
        saveDivision={saveDivision}
        memberOptions={memberOptions}
      />

      <DivisionMembersModal
        isOpen={divisionMembersModalOpen}
        onClose={() => setDivisionMembersModalOpen(false)}
        selectedDivision={selectedDivision}
        loadingDivisionMembers={loadingDivisionMembers}
        divisionMembers={divisionMembers}
        divisionMemberFilterStatus={divisionMemberFilterStatus}
        setDivisionMemberFilterStatus={setDivisionMemberFilterStatus}
        loadDivisionMembers={loadDivisionMembers}
        deleteDivisionMember={deleteDivisionMember}
        openAddDivisionMemberModal={() => setAddDivisionMemberModalOpen(true)}
      />

      <AddDivisionMemberModal
        isOpen={addDivisionMemberModalOpen}
        onClose={() => setAddDivisionMemberModalOpen(false)}
        selectedDivision={selectedDivision}
        divisionMemberForm={divisionMemberForm}
        setDivisionMemberForm={setDivisionMemberForm}
        saveDivisionMember={saveDivisionMember}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        searchMembers={searchMembers}
        memberOptions={memberOptions}
      />
    </div>
  );
};

export default OrganizationPage;
