import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  History,
  CheckCircle2,
  Briefcase,
  Layers,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

interface LookupMember {
  id: string;
  member_number: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  membership_type?: string;
  faculty?: string;
  graduation_year?: number;
}

interface CommitteeRecord {
  id: string;
  member_id: string;
  committee_name: string;
  role_title: string;
  event_year?: number;
  period?: string;
  start_date?: string;
  end_date?: string;
  status: 'AKTIF' | 'SELESAI' | 'DEMISIONER';
  description?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
}

interface OrgPosition {
  id: string;
  position_code: string;
  title: string;
  category: string;
  function_description?: string;
  hierarchy_order: number;
  is_active: boolean;
  current_tenure_id?: string;
  current_period?: string;
  current_start_date?: string;
  current_notes?: string;
  current_member_id?: string;
  current_member_name?: string;
  current_member_number?: string;
  current_member_phone?: string;
  current_member_email?: string;
  current_member_faculty?: string;
  current_member_graduation_year?: number;
  total_tenures_count: number;
}

interface OrgTenure {
  id: string;
  position_id: string;
  member_id: string;
  period: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  decree_number?: string;
  notes?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
  position_title: string;
  position_category: string;
}

interface StaffMember {
  id: string;
  member_id: string;
  department_id?: string;
  position_title: string;
  employment_type: string;
  joined_date?: string;
  end_date?: string;
  is_active: boolean;
  status: string;
  job_description?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
  department_name?: string;
}

interface Division {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  head_member_id?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  head_name?: string;
  head_member_number?: string;
  head_phone?: string;
  head_email?: string;
  active_members_count: number;
  total_history_count: number;
}

interface DivisionMember {
  id: string;
  department_id: string;
  member_id: string;
  role_title: string;
  period: string;
  start_date?: string;
  end_date?: string;
  status: 'AKTIF' | 'DEMISIONER' | 'ALUMNI_DIVISI';
  notes?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
}

export const OrganizationPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [committeeForm, setCommitteeForm] = useState({
    member_id: '',
    committee_name: '',
    role_title: '',
    event_year: new Date().getFullYear(),
    period: String(new Date().getFullYear()),
    start_date: '',
    end_date: '',
    status: 'AKTIF' as 'AKTIF' | 'SELESAI',
    description: '',
  });

  // --------------------------------------------------------------------------
  // Tab 2: Positions State
  // --------------------------------------------------------------------------
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<OrgPosition | null>(null);
  const [positionForm, setPositionForm] = useState({
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
  const [tenureForm, setTenureForm] = useState({
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
  const [staffForm, setStaffForm] = useState({
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
  const [divisionForm, setDivisionForm] = useState({
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
  const [divisionMemberForm, setDivisionMemberForm] = useState({
    member_id: '',
    role_title: 'Anggota Divisi',
    period: '2024 - Sekarang',
    start_date: '',
    end_date: '',
    status: 'AKTIF' as 'AKTIF' | 'DEMISIONER',
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

  // Initial load
  useEffect(() => {
    void loadStats();
    void searchMembers('');
  }, [loadStats, searchMembers]);

  useEffect(() => {
    if (activeTab === 'committees') void loadCommittees();
    if (activeTab === 'positions') void loadPositions();
    if (activeTab === 'staff') void loadStaff();
    if (activeTab === 'divisions') void loadDivisions();
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
    setCommitteeForm({
      member_id: memberOptions[0]?.id || '',
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
      status: c.status as any,
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
    setTenureForm({
      member_id: p.current_member_id || memberOptions[0]?.id || '',
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
    setStaffForm({
      member_id: memberOptions[0]?.id || '',
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
    setDivisionMemberForm({
      member_id: memberOptions[0]?.id || '',
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

      {/* Top Banner KPI Header */}
      <section
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '18px 22px',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#047857',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 750, color: '#0f172a' }}>
              Struktur & Kepengurusan Yayasan
            </h1>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
              Direktori kepanitiaan anggota, susunan pengurus inti, staf penuh waktu, dan divisi pelayanan GMH PA KMK
            </p>
          </div>
        </div>

        {/* 4 Summary KPI counters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>Kepanitiaan</div>
            <div style={{ fontSize: 18, fontWeight: 750, color: '#0f172a' }}>{stats.totalCommittees}</div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>Jabatan Inti</div>
            <div style={{ fontSize: 18, fontWeight: 750, color: '#047857' }}>{stats.totalPositions}</div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>Staf Full-Time</div>
            <div style={{ fontSize: 18, fontWeight: 750, color: '#0369a1' }}>{stats.totalStaff}</div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>Divisi Pelayanan</div>
            <div style={{ fontSize: 18, fontWeight: 750, color: '#b45309' }}>{stats.totalDivisions}</div>
          </div>
        </div>
      </section>

      {/* Modern Sub-Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: '#f1f5f9',
          padding: 5,
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('committees')}
          style={{
            padding: '8px 18px',
            borderRadius: 7,
            border: 'none',
            fontSize: 13,
            fontWeight: activeTab === 'committees' ? 700 : 500,
            background: activeTab === 'committees' ? '#ffffff' : 'transparent',
            color: activeTab === 'committees' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'committees' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Calendar size={15} color={activeTab === 'committees' ? '#047857' : '#94a3b8'} />
          <span>1. Riwayat Kepanitiaan</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'committees' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'committees' ? '#047857' : '#64748b' }}>
            {committees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          style={{
            padding: '8px 18px',
            borderRadius: 7,
            border: 'none',
            fontSize: 13,
            fontWeight: activeTab === 'positions' ? 700 : 500,
            background: activeTab === 'positions' ? '#ffffff' : 'transparent',
            color: activeTab === 'positions' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'positions' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={15} color={activeTab === 'positions' ? '#047857' : '#94a3b8'} />
          <span>2. Pengurus Inti Yayasan</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'positions' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'positions' ? '#047857' : '#64748b' }}>
            {positions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '8px 18px',
            borderRadius: 7,
            border: 'none',
            fontSize: 13,
            fontWeight: activeTab === 'staff' ? 700 : 500,
            background: activeTab === 'staff' ? '#ffffff' : 'transparent',
            color: activeTab === 'staff' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'staff' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Briefcase size={15} color={activeTab === 'staff' ? '#047857' : '#94a3b8'} />
          <span>3. Staf Full-Time</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'staff' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'staff' ? '#047857' : '#64748b' }}>
            {staffList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('divisions')}
          style={{
            padding: '8px 18px',
            borderRadius: 7,
            border: 'none',
            fontSize: 13,
            fontWeight: activeTab === 'divisions' ? 700 : 500,
            background: activeTab === 'divisions' ? '#ffffff' : 'transparent',
            color: activeTab === 'divisions' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'divisions' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={15} color={activeTab === 'divisions' ? '#047857' : '#94a3b8'} />
          <span>4. Divisi & Departemen</span>
          <span style={{ fontSize: 11, fontWeight: 750, padding: '2px 7px', borderRadius: 99, background: activeTab === 'divisions' ? '#ecfdf5' : '#e2e8f0', color: activeTab === 'divisions' ? '#047857' : '#64748b' }}>
            {divisions.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: RIWAYAT KEPANITIAAN (Ordered by created_at DESC)              */}
      {/* ==================================================================== */}
      {activeTab === 'committees' && (
        <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <header
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Log Record Riwayat Kepanitiaan & Pelayanan Anggota
                </h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 650 }}>
                  Order: Created At DESC
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                Pencatatan riwayat keterlibatan anggota yayasan dalam panitia natal, retret, pokja pembangunan, dan event pelayanan lainnya.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  aria-label="Cari kepanitiaan"
                  placeholder="Cari panitia / anggota..."
                  value={committeeSearch}
                  onChange={(e) => setCommitteeSearch(e.target.value)}
                  className="form-input form-input-sm"
                  style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
                />
              </div>

              <select
                value={committeeFilterStatus}
                onChange={(e) => setCommitteeFilterStatus(e.target.value)}
                className="form-select form-select-sm"
                style={{ fontSize: 12.5, height: 34, width: 140 }}
              >
                <option value="ALL">Semua Status</option>
                <option value="AKTIF">Aktif Melayani</option>
                <option value="SELESAI">Selesai / Demisioner</option>
              </select>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openNewCommitteeModal}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5 }}
              >
                <Plus size={14} /> Catat Kepanitiaan
              </button>
            </div>
          </header>

          {loadingCommittees ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              Memuat data kepanitiaan dari database PostgreSQL...
            </div>
          ) : paginatedCommittees.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              <Calendar size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
              <div style={{ fontWeight: 650, color: '#334155' }}>Belum ada record kepanitiaan yang dicatat</div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Klik tombol "Catat Kepanitiaan" untuk mencatat kepanitiaan yang pernah diemban oleh anggota.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 125 }}>Dicatat Pada</th>
                    <th>Nama Anggota (Relasi Anggota)</th>
                    <th>Kepanitiaan / Event</th>
                    <th style={{ width: 160 }}>Posisi / Jabatan</th>
                    <th style={{ width: 110 }}>Tahun / Periode</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th>Keterangan / Tanggung Jawab</th>
                    <th style={{ width: 85, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCommittees.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(row.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                          {new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#0f172a', fontSize: 13 }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${row.member_id}`)}
                            title="Buka Profil Anggota & Alumni"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              fontWeight: 650,
                              color: '#047857',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textAlign: 'left',
                            }}
                          >
                            <span>{row.member_name}</span>
                            <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                          <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                            {row.member_number}
                          </span>
                          {row.faculty && <span>{row.faculty} {row.graduation_year ? `'${String(row.graduation_year).slice(-2)}` : ''}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#1e293b', fontSize: 13 }}>
                          {row.committee_name}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                          {row.role_title}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                        {row.period || row.event_year || '—'}
                      </td>
                      <td>
                        {row.status === 'AKTIF' ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 650, padding: '3px 8px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                            Selesai
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                        {row.description || '—'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => openEditCommitteeModal(row)}
                            title="Edit Record"
                            style={{ padding: '4px 6px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => deleteCommittee(row.id)}
                            title="Hapus Record"
                            style={{ padding: '4px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
            <Pagination
              currentPage={committeePage}
              totalPages={committeeTotalPages}
              totalItems={committees.length}
              pageSize={committeePageSize}
              onPageChange={setCommitteePage}
              onPageSizeChange={setCommitteePageSize}
            />
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PENGURUS INTI YAYASAN (Struktur Dinamis + History Jabatan)     */}
      {/* ==================================================================== */}
      {activeTab === 'positions' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Susunan Struktur Kepengurusan Yayasan GMH Inti
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                Struktur jabatan dibuat dinamis. Setiap jabatan dapat dilihat riwayat siapa saja yang pernah menjabat dari periode ke periode.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openNewPositionModal}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5 }}
            >
              <Plus size={14} /> Tambah Jabatan Baru
            </button>
          </div>

          {loadingPositions ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              Memuat susunan kepengurusan dari database...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 20 }}>
              {/* Category Groups */}
              {[
                { key: 'DEWAN_PEMBINA', label: '1. Dewan Pembina Yayasan', badge: 'Penjaga Visi & Doktrin', color: '#1e3a8a', bg: '#eff6ff' },
                { key: 'DEWAN_PENGAWAS', label: '2. Dewan Pengawas Yayasan', badge: 'Tata Kelola & Audit Aset', color: '#7c2d12', bg: '#fff7ed' },
                { key: 'PENGURUS_HARIAN', label: '3. Dewan Pengurus Harian (Badan Pelaksana)', badge: 'Eksekutif Operasional', color: '#065f46', bg: '#ecfdf5' },
                { key: 'LAINNYA', label: '4. Posisi Struktur Lainnya', badge: 'Struktural Khusus', color: '#475569', bg: '#f8fafc' },
              ].map((cat) => {
                const groupPositions = (categorizedPositions as any)[cat.key] || [];
                if (groupPositions.length === 0 && cat.key === 'LAINNYA') return null;

                return (
                  <div key={cat.key} style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '12px 18px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{cat.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, padding: '3px 9px', borderRadius: 99 }}>
                        {cat.badge}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14, padding: 16 }}>
                      {groupPositions.map((pos: OrgPosition) => (
                        <div
                          key={pos.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 9,
                            padding: 16,
                            background: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 12,
                            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 750, color: '#0f172a' }}>
                                  {pos.title}
                                </h3>
                                <code style={{ fontSize: 10.5, color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                                  {pos.position_code}
                                </code>
                              </div>

                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-xs"
                                  onClick={() => openEditPositionModal(pos)}
                                  title="Ubah Jabatan & Fungsi"
                                  style={{ padding: '3px 6px' }}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-xs"
                                  onClick={() => deletePosition(pos.id)}
                                  title="Hapus Jabatan"
                                  style={{ padding: '3px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Job function */}
                            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.45 }}>
                              {pos.function_description || 'Belum ada rincian tugas dan fungsi jabatan yang diisi.'}
                            </p>
                          </div>

                          {/* Current Holder Card */}
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              background: pos.current_member_name ? '#f0fdf4' : '#fffbeb',
                              border: `1px solid ${pos.current_member_name ? '#bbf7d0' : '#fde68a'}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: pos.current_member_name ? '#15803d' : '#b45309', textTransform: 'uppercase' }}>
                                Pejabat Aktif ({pos.current_period || 'Periode Belum Ditugaskan'})
                              </span>
                              {pos.current_member_name && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>
                                  Aktif
                                </span>
                              )}
                            </div>

                            {pos.current_member_name ? (
                              <div style={{ marginTop: 4 }}>
                                <div style={{ fontWeight: 750, color: '#0f172a', fontSize: 13.5 }}>
                                  <button
                                    type="button"
                                    onClick={() => pos.current_member_id && navigate(`/members/${pos.current_member_id}`)}
                                    title="Buka Profil Anggota & Alumni"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      padding: 0,
                                      fontWeight: 750,
                                      color: '#047857',
                                      fontSize: 13.5,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      textAlign: 'left',
                                    }}
                                  >
                                    <span>{pos.current_member_name}</span>
                                    <ExternalLink size={12} style={{ opacity: 0.7 }} />
                                  </button>
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', gap: 6, marginTop: 2 }}>
                                  <span>{pos.current_member_number}</span>
                                  {pos.current_member_phone && <span>· {pos.current_member_phone}</span>}
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginTop: 4, fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>
                                Belum ada anggota yang ditugaskan menjabat periode ini.
                              </div>
                            )}
                          </div>

                          {/* Action Footer: History & Tugaskan */}
                          <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => openHistoryModal(pos)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5 }}
                            >
                              <History size={13} /> Riwayat Jabatan ({pos.total_tenures_count})
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => openAssignTenureModal(pos)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5 }}
                            >
                              <Plus size={13} /> Tugaskan Pejabat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: STAF FULL-TIME                                                */}
      {/* ==================================================================== */}
      {activeTab === 'staff' && (
        <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <header
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Direktori Staf Penuh Waktu (Full-Time Staff Yayasan)
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                Pekerja penuh waktu yayasan yang bertanggung jawab menjalankan roda operasional kantor, pemuridan, dan pemeliharaan aset.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  aria-label="Cari staf"
                  placeholder="Cari nama / posisi staf..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="form-input form-input-sm"
                  style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openNewStaffModal}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5 }}
              >
                <Plus size={14} /> Tambah Staf Full-Time
              </button>
            </div>
          </header>

          {loadingStaff ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              Memuat data staf penuh waktu dari database...
            </div>
          ) : staffList.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              <Briefcase size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
              <div style={{ fontWeight: 650, color: '#334155' }}>Belum ada data staf penuh waktu</div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Klik tombol "Tambah Staf Full-Time" untuk mendaftarkan staf baru dari basis data anggota.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Staf (Relasi Anggota)</th>
                    <th style={{ width: 175 }}>Posisi / Pekerjaan</th>
                    <th style={{ width: 175 }}>Departemen / Divisi</th>
                    <th style={{ width: 125 }}>Tgl Bergabung</th>
                    <th style={{ width: 105 }}>Status</th>
                    <th>Tugas & Tanggung Jawab</th>
                    <th style={{ width: 85, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${s.member_id}`)}
                            title="Buka Profil Anggota & Alumni"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              fontWeight: 700,
                              color: '#047857',
                              fontSize: 13.5,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textAlign: 'left',
                            }}
                          >
                            <span>{s.member_name}</span>
                            <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 6, marginTop: 2 }}>
                          <span style={{ fontFamily: 'monospace' }}>{s.member_number}</span>
                          {s.phone_number && <span>· {s.phone_number}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#0369a1', fontSize: 13 }}>
                          {s.position_title}
                        </div>
                        <span style={{ fontSize: 10.5, color: '#64748b' }}>{s.employment_type}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: 12 }}>
                          {s.department_name || 'Kantor Operasional GMH'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#475569' }}>
                        {s.joined_date
                          ? new Date(s.joined_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        {s.is_active ? (
                          <span style={{ fontSize: 11, fontWeight: 750, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 650, padding: '3px 8px', borderRadius: 99, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                        {s.job_description || '—'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => openEditStaffModal(s)}
                            title="Edit Staf"
                            style={{ padding: '4px 6px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => deleteStaff(s.id)}
                            title="Hapus Staf"
                            style={{ padding: '4px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: DIVISI & DEPARTEMEN + ANGGOTA & HISTORY                      */}
      {/* ==================================================================== */}
      {activeTab === 'divisions' && (
        <section style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Divisi & Departemen Pelayanan Yayasan
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                Divisi dapat ditambah secara dinamis. Setiap divisi mengelola daftar anggota bertugas dan riwayat pejabat/alumni divisi.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openNewDivisionModal}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5 }}
            >
              <Plus size={14} /> Tambah Divisi Baru
            </button>
          </div>

          {loadingDivisions ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              Memuat daftar divisi dari database...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {divisions.map((div) => (
                <div
                  key={div.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 18,
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>
                          {div.id}
                        </span>
                        <h3 style={{ margin: '6px 0 0', fontSize: 15.5, fontWeight: 750, color: '#0f172a' }}>
                          {div.name}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openEditDivisionModal(div)}
                          title="Ubah Divisi"
                          style={{ padding: '3px 6px' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => deleteDivision(div.id)}
                          title="Hapus Divisi"
                          style={{ padding: '3px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12.5, lineHeight: 1.45 }}>
                      {div.description || 'Tidak ada deskripsi rincian tugas divisi.'}
                    </p>
                  </div>

                  {/* Koordinator Divisi Box */}
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>
                      Koordinator / Ketua Divisi:
                    </div>
                    {div.head_name ? (
                      <div style={{ marginTop: 4, fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {div.head_member_id ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${div.head_member_id}`)}
                            title="Buka Profil Anggota & Alumni"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              fontWeight: 700,
                              color: '#047857',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textAlign: 'left',
                            }}
                          >
                            <span>{div.head_name}</span>
                            <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </button>
                        ) : (
                          <span>{div.head_name}</span>
                        )}
                        {div.head_phone && <span style={{ fontWeight: 400, color: '#64748b', fontSize: 11.5 }}> · {div.head_phone}</span>}
                      </div>
                    ) : (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                        Belum ditetapkan
                      </div>
                    )}
                  </div>

                  {/* Stats Counter & Kelola Anggota Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      <strong style={{ color: '#047857' }}>{div.active_members_count}</strong> aktif · <strong>{div.total_history_count}</strong> riwayat
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => openDivisionMembersModal(div)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}
                      >
                        <History size={13} /> Riwayat & Anggota
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => openAddDivisionMemberModal(div)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}
                      >
                        <Plus size={13} /> Tugaskan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: Catat / Edit Kepanitiaan                                    */}
      {/* ==================================================================== */}
      {committeeModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 540, width: '90%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {editingCommittee ? 'Ubah Record Kepanitiaan' : 'Catat Kepanitiaan Baru'}
              </h3>
              <button type="button" onClick={() => setCommitteeModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveCommittee} style={{ display: 'grid', gap: 14 }}>
              {/* Member Picker (Rule 5: Diambil dari list anggota) */}
              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Pilih Anggota yang Melayani <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ marginBottom: 6 }}>
                  <input
                    placeholder="Ketik untuk filter nama anggota..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      void searchMembers(e.target.value);
                    }}
                    className="form-input form-input-sm"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <select
                  required
                  value={committeeForm.member_id}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, member_id: e.target.value })}
                  className="form-select form-select-sm"
                  style={{ fontSize: 13 }}
                >
                  <option value="">-- Pilih Anggota Terdaftar --</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Nama Kepanitiaan / Kegiatan <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  required
                  placeholder="Contoh: Panitia Natal Bersama Alumni 2025"
                  value={committeeForm.committee_name}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, committee_name: e.target.value })}
                  className="form-input form-input-sm"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Posisi / Jabatan Kepanitiaan <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    required
                    placeholder="Contoh: Ketua Panitia / Sie Acara"
                    value={committeeForm.role_title}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, role_title: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Tahun / Periode
                  </label>
                  <input
                    placeholder="Contoh: 2025"
                    value={committeeForm.period}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, period: e.target.value, event_year: Number(e.target.value) || 2025 })}
                    className="form-input form-input-sm"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Status Kepanitiaan
                </label>
                <select
                  value={committeeForm.status}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, status: e.target.value as any })}
                  className="form-select form-select-sm"
                >
                  <option value="AKTIF">Aktif (Sedang Bertugas)</option>
                  <option value="SELESAI">Selesai / Demisioner</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Keterangan / Tanggung Jawab / Pencapaian
                </label>
                <textarea
                  rows={3}
                  placeholder="Rincian deskripsi tugas atau hasil kegiatan..."
                  value={committeeForm.description}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, description: e.target.value })}
                  className="form-input form-input-sm"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCommitteeModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: Tambah / Ubah Struktur Jabatan Inti (Dinamis)                */}
      {/* ==================================================================== */}
      {positionModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 520, width: '90%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {editingPosition ? 'Ubah Struktur Jabatan' : 'Tambah Struktur Jabatan Baru'}
              </h3>
              <button type="button" onClick={() => setPositionModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={savePosition} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Nama Jabatan Kepengurusan <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  required
                  placeholder="Contoh: Ketua Dewan Pembina / Bendahara Umum"
                  value={positionForm.title}
                  onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
                  className="form-input form-input-sm"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Kategori Badan
                  </label>
                  <select
                    value={positionForm.category}
                    onChange={(e) => setPositionForm({ ...positionForm, category: e.target.value })}
                    className="form-select form-select-sm"
                  >
                    <option value="DEWAN_PEMBINA">Dewan Pembina</option>
                    <option value="DEWAN_PENGAWAS">Dewan Pengawas</option>
                    <option value="PENGURUS_HARIAN">Dewan Pengurus Harian</option>
                    <option value="LAINNYA">Struktur Khusus Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Kode Jabatan (Opsional)
                  </label>
                  <input
                    placeholder="Contoh: KETUA_UMUM"
                    value={positionForm.position_code}
                    onChange={(e) => setPositionForm({ ...positionForm, position_code: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Deskripsi Fungsi & Tanggung Jawab Jabatan
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan peran pokok dan wewenang jabatan ini dalam yayasan..."
                  value={positionForm.function_description}
                  onChange={(e) => setPositionForm({ ...positionForm, function_description: e.target.value })}
                  className="form-input form-input-sm"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPositionModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Jabatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2B: Tugaskan Pejabat ke Posisi                                 */}
      {/* ==================================================================== */}
      {assignTenureModalOpen && selectedPositionForHistory && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 520, width: '90%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Tugaskan Pejabat: {selectedPositionForHistory.title}
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>Pilih anggota yayasan yang memegang jabatan ini</span>
              </div>
              <button type="button" onClick={() => setAssignTenureModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveTenure} style={{ display: 'grid', gap: 14 }}>
              {/* Member lookup */}
              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Pilih Anggota <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ marginBottom: 6 }}>
                  <input
                    placeholder="Ketik untuk filter nama anggota..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      void searchMembers(e.target.value);
                    }}
                    className="form-input form-input-sm"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <select
                  required
                  value={tenureForm.member_id}
                  onChange={(e) => setTenureForm({ ...tenureForm, member_id: e.target.value })}
                  className="form-select form-select-sm"
                >
                  <option value="">-- Pilih Anggota Terdaftar --</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Periode Menjabat <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    required
                    placeholder="Contoh: 2024 - 2027"
                    value={tenureForm.period}
                    onChange={(e) => setTenureForm({ ...tenureForm, period: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Nomor SK Pengangkatan
                  </label>
                  <input
                    placeholder="Contoh: SK-GMH/01/2024"
                    value={tenureForm.decree_number}
                    onChange={(e) => setTenureForm({ ...tenureForm, decree_number: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={tenureForm.is_current}
                    onChange={(e) => setTenureForm({ ...tenureForm, is_current: e.target.checked })}
                  />
                  <span>Tetapkan sebagai Pejabat Aktif Saat Ini</span>
                </label>
                <div style={{ fontSize: 11, color: '#64748b', marginLeft: 22, marginTop: 2 }}>
                  Jika dicentang, pejabat aktif sebelumnya pada posisi ini otomatis diubah menjadi demisioner/riwayat masa lalu.
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Catatan Pelayanan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan surat keputusan rapat alumni / pelantikan..."
                  value={tenureForm.notes}
                  onChange={(e) => setTenureForm({ ...tenureForm, notes: e.target.value })}
                  className="form-input form-input-sm"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAssignTenureModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Pejabat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2C: Riwayat Pejabat Posisi (History Tab 2)                      */}
      {/* ==================================================================== */}
      {historyModalOpen && selectedPositionForHistory && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 680, width: '92%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Riwayat Pejabat: {selectedPositionForHistory.title}
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Rekam jejak seluruh anggota yang pernah memegang jabatan ini dari masa ke masa
                </span>
              </div>
              <button type="button" onClick={() => setHistoryModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {loadingTenures ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                Memuat riwayat pejabat dari database...
              </div>
            ) : positionTenures.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                Belum ada data riwayat pejabat untuk jabatan ini.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {positionTenures.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '12px 16px',
                      background: t.is_current ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/members/${t.member_id}`)}
                          title="Buka Profil Anggota & Alumni"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            fontWeight: 750,
                            color: '#047857',
                            fontSize: 13.5,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textAlign: 'left',
                          }}
                        >
                          <span>{t.member_name}</span>
                          <ExternalLink size={11} style={{ opacity: 0.7 }} />
                        </button>
                        {t.is_current ? (
                          <span style={{ fontSize: 10.5, fontWeight: 700, background: '#22c55e', color: '#ffffff', padding: '1px 6px', borderRadius: 99 }}>
                            Pejabat Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, fontWeight: 650, background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: 99 }}>
                            Demisioner
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        Periode: <strong style={{ color: '#0f172a' }}>{t.period}</strong>
                        {t.decree_number && <span> · No. SK: {t.decree_number}</span>}
                      </div>

                      {t.notes && (
                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                          "{t.notes}"
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => deleteTenure(t.id)}
                      title="Hapus Record Riwayat"
                      style={{ color: '#b91c1c', borderColor: '#fecaca', padding: '4px 6px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setAssignTenureModalOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Catat Riwayat / Pejabat Baru
              </button>

              <button type="button" className="btn btn-outline btn-sm" onClick={() => setHistoryModalOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: Tambah / Ubah Staf Full-Time                                */}
      {/* ==================================================================== */}
      {staffModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 540, width: '90%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {editingStaff ? 'Ubah Data Staf Full-Time' : 'Tambah Staf Penuh Waktu Baru'}
              </h3>
              <button type="button" onClick={() => setStaffModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveStaff} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Pilih Anggota <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ marginBottom: 6 }}>
                  <input
                    placeholder="Ketik untuk filter nama anggota..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      void searchMembers(e.target.value);
                    }}
                    className="form-input form-input-sm"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <select
                  required
                  value={staffForm.member_id}
                  onChange={(e) => setStaffForm({ ...staffForm, member_id: e.target.value })}
                  className="form-select form-select-sm"
                >
                  <option value="">-- Pilih Anggota Terdaftar --</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Posisi / Jabatan Staf <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    required
                    placeholder="Contoh: Manajer Operasional"
                    value={staffForm.position_title}
                    onChange={(e) => setStaffForm({ ...staffForm, position_title: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Divisi / Departemen
                  </label>
                  <select
                    value={staffForm.department_id}
                    onChange={(e) => setStaffForm({ ...staffForm, department_id: e.target.value })}
                    className="form-select form-select-sm"
                  >
                    <option value="">-- Kantor Operasional Yayasan --</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={staffForm.joined_date}
                    onChange={(e) => setStaffForm({ ...staffForm, joined_date: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Status Staf
                  </label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value, is_active: e.target.value === 'AKTIF' })}
                    className="form-select form-select-sm"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="CUTI">Cuti</option>
                    <option value="PURNA_TUGAS">Purna Tugas / Resign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Deskripsi Tugas & Tanggung Jawab
                </label>
                <textarea
                  rows={3}
                  placeholder="Rincian deskripsi pekerjaan harian staf..."
                  value={staffForm.job_description}
                  onChange={(e) => setStaffForm({ ...staffForm, job_description: e.target.value })}
                  className="form-input form-input-sm"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setStaffModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: Tambah / Ubah Divisi                                        */}
      {/* ==================================================================== */}
      {divisionModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 520, width: '90%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {editingDivision ? 'Ubah Data Divisi' : 'Tambah Divisi Pelayanan Baru'}
              </h3>
              <button type="button" onClick={() => setDivisionModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveDivision} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Nama Divisi / Departemen <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  required
                  placeholder="Contoh: Divisi Misi & Penginjilan"
                  value={divisionForm.name}
                  onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
                  className="form-input form-input-sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Koordinator / Ketua Divisi (Pilih dari Anggota)
                </label>
                <select
                  value={divisionForm.head_member_id}
                  onChange={(e) => setDivisionForm({ ...divisionForm, head_member_id: e.target.value })}
                  className="form-select form-select-sm"
                >
                  <option value="">-- Belum Ditetapkan --</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Deskripsi / Fokus Pelayanan Divisi
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ruang lingkup dan program kerja divisi..."
                  value={divisionForm.description}
                  onChange={(e) => setDivisionForm({ ...divisionForm, description: e.target.value })}
                  className="form-input form-input-sm"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setDivisionModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Divisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4B: Kelola Anggota Divisi & Record History                     */}
      {/* ==================================================================== */}
      {divisionMembersModalOpen && selectedDivision && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 720, width: '92%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Anggota & Riwayat Divisi: {selectedDivision.name}
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Daftar seluruh anggota yang aktif bertugas maupun yang pernah menjabat di divisi ini
                </span>
              </div>
              <button type="button" onClick={() => setDivisionMembersModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Filter Status Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ALL', 'AKTIF', 'DEMISIONER'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setDivisionMemberFilterStatus(st);
                      void loadDivisionMembers(selectedDivision.id, st);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid #e2e8f0',
                      background: divisionMemberFilterStatus === st ? '#0f172a' : '#f8fafc',
                      color: divisionMemberFilterStatus === st ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {st === 'ALL' ? 'Semua Status' : st === 'AKTIF' ? 'Aktif' : 'Demisioner / Alumni Divisi'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => setAddDivisionMemberModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Plus size={13} /> Tugaskan Anggota
              </button>
            </div>

            {loadingDivisionMembers ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                Memuat anggota divisi...
              </div>
            ) : divisionMembers.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                Belum ada anggota yang terdaftar pada divisi ini.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {divisionMembers.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '10px 14px',
                      background: m.status === 'AKTIF' ? '#ffffff' : '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/members/${m.member_id}`)}
                          title="Buka Profil Anggota & Alumni"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            fontWeight: 750,
                            color: '#047857',
                            fontSize: 13.5,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textAlign: 'left',
                          }}
                        >
                          <span>{m.member_name}</span>
                          <ExternalLink size={11} style={{ opacity: 0.7 }} />
                        </button>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#ecfdf5', color: '#047857' }}>
                          {m.role_title}
                        </span>
                        {m.status === 'AKTIF' ? (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#22c55e', color: '#fff', padding: '1px 5px', borderRadius: 99 }}>
                            Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 600, background: '#e2e8f0', color: '#64748b', padding: '1px 5px', borderRadius: 99 }}>
                            Demisioner
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        Periode: <strong>{m.period}</strong> · No. Anggota: {m.member_number}
                        {m.faculty && <span> ({m.faculty})</span>}
                      </div>

                      {m.notes && (
                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
                          Catatan: {m.notes}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => deleteDivisionMember(m.id)}
                      title="Hapus Penugasan"
                      style={{ color: '#b91c1c', borderColor: '#fecaca', padding: '4px 6px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDivisionMembersModalOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4C: Tugaskan Anggota ke Divisi                                 */}
      {/* ==================================================================== */}
      {addDivisionMemberModalOpen && selectedDivision && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: 500, width: '90%', padding: 22, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#0f172a' }}>
                Tugaskan Anggota ke: {selectedDivision.name}
              </h3>
              <button type="button" onClick={() => setAddDivisionMemberModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveDivisionMember} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Pilih Anggota <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ marginBottom: 6 }}>
                  <input
                    placeholder="Ketik untuk filter nama anggota..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      void searchMembers(e.target.value);
                    }}
                    className="form-input form-input-sm"
                    style={{ fontSize: 12 }}
                  />
                </div>
                <select
                  required
                  value={divisionMemberForm.member_id}
                  onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, member_id: e.target.value })}
                  className="form-select form-select-sm"
                >
                  <option value="">-- Pilih Anggota Terdaftar --</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Peran / Jabatan Divisi <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    required
                    placeholder="Contoh: Koordinator / Staf"
                    value={divisionMemberForm.role_title}
                    onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, role_title: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                    Periode Pelayanan
                  </label>
                  <input
                    placeholder="Contoh: 2024 - Sekarang"
                    value={divisionMemberForm.period}
                    onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, period: e.target.value })}
                    className="form-input form-input-sm"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Status Keanggotaan Divisi
                </label>
                <select
                  value={divisionMemberForm.status}
                  onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, status: e.target.value as any })}
                  className="form-select form-select-sm"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="DEMISIONER">Demisioner / Riwayat Lampau</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                  Catatan Penugasan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penugasan khusus..."
                  value={divisionMemberForm.notes}
                  onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, notes: e.target.value })}
                  className="form-input form-input-sm"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddDivisionMemberModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Tugaskan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
