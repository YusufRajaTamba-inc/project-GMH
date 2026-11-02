import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  HardHat,
  RefreshCw,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Search,
  Check,
  AlertCircle,
  FolderKanban,
  ArrowLeft,
  ChevronRight,
  Eye,
  User,
  Clock,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';
import NominalInput from '../../components/NominalInput';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

export interface Milestone {
  id: number;
  label: string;
  date: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  pct: number;
}

export interface FoundationProject {
  id: string;
  project_name: string;
  category?: string;
  target_budget: string | number;
  current_funds: string | number;
  progress_percentage: number;
  status: 'ON_PROGRESS' | 'COMPLETED' | 'PLANNING' | string;
  description: string;
  pic_name?: string;
  start_date?: string | null;
  target_completion_date?: string | null;
  milestones?: Milestone[];
}

const CATEGORY_LABELS: Record<string, string> = {
  INFRASTRUKTUR: 'Infrastruktur & Gedung',
  FASILITAS: 'Fasilitas & Ruang Doa',
  MISI: 'Pelayanan Misi',
  PENDIDIKAN_IT: 'Pendidikan & IT',
  SOSIAL_BEASISWA: 'Sosial & Beasiswa',
  LAINNYA: 'Lainnya',
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  INFRASTRUKTUR: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  FASILITAS: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  MISI: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  PENDIDIKAN_IT: { bg: '#f3e8ff', color: '#6d28d9', border: '#ddd6fe' },
  SOSIAL_BEASISWA: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
  LAINNYA: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' },
};

// Clean Date Formatter helper
const formatDateId = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).slice(0, 10);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const BuildingProjectPage: React.FC = () => {
  const { lookups, fieldLabels } = useDynamicConfig();
  // Navigation View: 'list' (Daftar Proyek) or 'detail' (Halaman Detail Proyek)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [projects, setProjects] = useState<FoundationProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<FoundationProject | null>(null);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showProgressUpdateModal, setShowProgressUpdateModal] = useState(false);

  // Form State for New Project
  const [formProject, setFormProject] = useState({
    projectName: '',
    category: 'INFRASTRUKTUR',
    targetBudget: 0,
    currentFunds: 0,
    progressPercentage: 0,
    status: 'ON_PROGRESS',
    description: '',
    picName: '',
    targetCompletionDate: '',
  });

  // Form State for Adding Milestone
  const [formMilestone, setFormMilestone] = useState({
    label: '',
    date: '',
    status: 'IN_PROGRESS' as 'DONE' | 'IN_PROGRESS' | 'PENDING',
    pct: 50,
  });

  // Form State for Quick Project Progress Update
  const [formProgressUpdate, setFormProgressUpdate] = useState({
    progressPercentage: 0,
    currentFunds: 0,
    status: 'ON_PROGRESS',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchProjectData = async () => {
    setIsLoading(true);
    try {
      const res = await api.building.getProjects().catch(() => null);
      if (res?.projects && Array.isArray(res.projects)) {
        setProjects(res.projects);
        if (res.projects.length > 0) {
          if (!selectedProjectId || !res.projects.find((p: any) => p.id === selectedProjectId)) {
            setSelectedProjectId(res.projects[0].id);
          }
        } else {
          setSelectedProjectId('');
        }
      } else {
        const single = await api.building.getProject().catch(() => null);
        if (single?.projects && Array.isArray(single.projects)) {
          setProjects(single.projects);
          if (single.projects.length > 0) setSelectedProjectId(single.projects[0].id);
        } else if (single?.project) {
          setProjects([single.project]);
          setSelectedProjectId(single.project.id);
        } else {
          setProjects([]);
          setSelectedProjectId('');
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data proyek dari API:', err);
      setProjects([]);
      setSelectedProjectId('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const s = search.toLowerCase().trim();
      const matchSearch =
        !s ||
        (p.project_name || '').toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s) ||
        (p.pic_name || '').toLowerCase().includes(s);

      const matchCat = filterCategory ? (p.category || 'INFRASTRUKTUR') === filterCategory : true;
      const matchStatus = filterStatus ? p.status === filterStatus : true;

      return matchSearch && matchCat && matchStatus;
    });
  }, [projects, search, filterCategory, filterStatus]);

  // Pagination for projects list
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedProjects,
  } = usePagination(filteredProjects, { initialPageSize: 6 });

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterStatus, setCurrentPage]);

  // Selected Active Project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Milestones of active project
  const activeMilestones: Milestone[] = useMemo(() => {
    if (activeProject?.milestones && Array.isArray(activeProject.milestones)) {
      return activeProject.milestones;
    }
    return [];
  }, [activeProject]);

  // Portfolio Totals
  const totalTargetAll = projects.reduce((s, p) => s + (Number(p.target_budget) || 0), 0);
  const totalCollectedAll = projects.reduce((s, p) => s + (Number(p.current_funds) || 0), 0);
  const overallFinancialPct = totalTargetAll > 0 ? Math.round((totalCollectedAll / totalTargetAll) * 100) : 0;
  const totalActiveProjects = projects.filter((p) => p.status === 'ON_PROGRESS').length;

  // Active Project metrics
  const activeTarget = Number(activeProject?.target_budget || 0);
  const activeCollected = Number(activeProject?.current_funds || 0);
  const activeFinancialPct = activeTarget > 0 ? Math.round((activeCollected / activeTarget) * 100) : 0;
  const activeRemaining = Math.max(0, activeTarget - activeCollected);
  const activePhysicalPct = activeProject?.progress_percentage || 0;

  // Navigate to Detail Page
  const handleOpenDetail = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back to List View
  const handleBackToList = () => {
    setViewMode('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Edit Modal with sanitized numeric fields
  const handleOpenEditProject = (proj: FoundationProject) => {
    setEditingProject({
      ...proj,
      target_budget: Number(proj.target_budget) || 0,
      current_funds: Number(proj.current_funds) || 0,
      progress_percentage: Number(proj.progress_percentage) || 0,
    });
  };

  // Open Quick Progress Modal
  const handleOpenProgressUpdate = () => {
    if (!activeProject) return;
    setFormProgressUpdate({
      progressPercentage: Number(activeProject.progress_percentage) || 0,
      currentFunds: Number(activeProject.current_funds) || 0,
      status: activeProject.status || 'ON_PROGRESS',
    });
    setShowProgressUpdateModal(true);
  };

  // Save Quick Progress Update
  const handleSaveProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    try {
      await api.building.updateProject(activeProject.id, {
        progressPercentage: formProgressUpdate.progressPercentage,
        currentFunds: formProgressUpdate.currentFunds,
        status: formProgressUpdate.status,
      });

      const updatedProject: FoundationProject = {
        ...activeProject,
        progress_percentage: formProgressUpdate.progressPercentage,
        current_funds: formProgressUpdate.currentFunds,
        status: formProgressUpdate.status,
      };

      setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProject : p)));
      showToast(`Progres fisik (${formProgressUpdate.progressPercentage}%) & dana berhasil diperbarui!`);
      setShowProgressUpdateModal(false);
    } catch (err: any) {
      alert('Gagal memperbarui progres: ' + (err.message || 'Terjadi kesalahan sistem.'));
    }
  };

  // Save New Milestone
  const handleSaveNewMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!formMilestone.label.trim()) {
      alert('Nama tahapan kerja wajib diisi.');
      return;
    }

    const currentList = [...activeMilestones];
    const newId = currentList.length + 1;
    const dateFormatted = formMilestone.date.trim()
      ? formMilestone.date.startsWith('Jadwal Target')
        ? formMilestone.date.trim()
        : `Jadwal Target: ${formMilestone.date.trim()}`
      : `Jadwal Target: Fase ${newId}`;

    const newMilestone: Milestone = {
      id: newId,
      label: formMilestone.label.trim(),
      date: dateFormatted,
      status: formMilestone.status,
      pct: formMilestone.status === 'DONE' ? 100 : formMilestone.status === 'IN_PROGRESS' ? formMilestone.pct : 0,
    };

    const updatedList = [...currentList, newMilestone];

    // Automatically recalculate average physical progress
    const avgPct = Math.round(
      updatedList.reduce((acc, curr) => acc + (curr.pct || 0), 0) / updatedList.length
    );

    const updatedProject: FoundationProject = {
      ...activeProject,
      progress_percentage: avgPct,
      milestones: updatedList,
    };

    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProject : p)));

    try {
      await api.building.updateProject(activeProject.id, {
        progressPercentage: avgPct,
        milestones: updatedList,
      });
      showToast(`Tahapan kerja baru "${newMilestone.label}" berhasil ditambahkan!`);
      setShowAddMilestoneModal(false);
      setFormMilestone({
        label: '',
        date: '',
        status: 'IN_PROGRESS',
        pct: 50,
      });
    } catch (err: any) {
      console.warn('Gagal menyimpan tahapan ke server:', err);
    }
  };

  // Toggle or Update Milestone Status
  const handleToggleMilestone = async (mIndex: number) => {
    if (!activeProject) return;
    const currentList = [...activeMilestones];
    const item = currentList[mIndex];
    if (!item) return;

    // Cycle: DONE -> IN_PROGRESS -> PENDING -> DONE
    let nextStatus: 'DONE' | 'IN_PROGRESS' | 'PENDING' = 'DONE';
    let nextPct = 100;
    if (item.status === 'DONE') {
      nextStatus = 'IN_PROGRESS';
      nextPct = 60;
    } else if (item.status === 'IN_PROGRESS') {
      nextStatus = 'PENDING';
      nextPct = 0;
    } else {
      nextStatus = 'DONE';
      nextPct = 100;
    }

    currentList[mIndex] = { ...item, status: nextStatus, pct: nextPct };

    // Calculate new overall physical progress percentage
    const avgPct = Math.round(
      currentList.reduce((acc, curr) => acc + (curr.pct || 0), 0) / currentList.length
    );

    const updatedProject: FoundationProject = {
      ...activeProject,
      progress_percentage: avgPct,
      milestones: currentList,
    };

    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProject : p)));

    try {
      await api.building.updateProject(activeProject.id, {
        progressPercentage: avgPct,
        milestones: currentList,
      });
      showToast(`Status tahapan "${item.label}" diubah ke ${nextStatus === 'DONE' ? 'Selesai 100%' : nextStatus === 'IN_PROGRESS' ? 'Sedang Berjalan' : 'Rencana'}.`);
    } catch (err: any) {
      console.warn('Gagal sinkron status tahapan ke server:', err);
    }
  };

  // Delete Milestone
  const handleDeleteMilestone = async (mIndex: number) => {
    if (!activeProject) return;
    const item = activeMilestones[mIndex];
    if (!item) return;

    if (confirm(`Hapus tahapan kerja "${item.label}"?`)) {
      const updatedList = activeMilestones.filter((_, idx) => idx !== mIndex).map((m, idx) => ({ ...m, id: idx + 1 }));
      const avgPct = updatedList.length > 0
        ? Math.round(updatedList.reduce((acc, curr) => acc + (curr.pct || 0), 0) / updatedList.length)
        : activeProject.progress_percentage;

      const updatedProject: FoundationProject = {
        ...activeProject,
        progress_percentage: avgPct,
        milestones: updatedList,
      };

      setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProject : p)));

      try {
        await api.building.updateProject(activeProject.id, {
          progressPercentage: avgPct,
          milestones: updatedList,
        });
        showToast(`Tahapan "${item.label}" telah dihapus.`);
      } catch (err: any) {
        console.warn('Gagal menghapus tahapan:', err);
      }
    }
  };

  // Save New Project Handler
  const handleSaveNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProject.projectName.trim()) {
      alert('Nama proyek yayasan wajib diisi.');
      return;
    }
    if (formProject.targetBudget <= 0) {
      alert('Target anggaran proyek harus lebih besar dari Rp 0.');
      return;
    }

    const defaultNewMilestones: Milestone[] = [
      { id: 1, label: 'Perencanaan & Survei Kebutuhan', date: 'Jadwal Target: Bulan 1', status: 'DONE', pct: 100 },
      { id: 2, label: 'Sosialisasi & Penggalangan Komitmen', date: 'Jadwal Target: Bulan 2', status: 'IN_PROGRESS', pct: 50 },
      { id: 3, label: 'Pelaksanaan Pekerjaan di Lapangan', date: 'Jadwal Target: Bulan 3-6', status: 'PENDING', pct: 0 },
      { id: 4, label: 'Uji Fungsi & Serah Terima', date: 'Jadwal Target: Akhir Periode', status: 'PENDING', pct: 0 },
    ];

    try {
      const payload = {
        ...formProject,
        milestones: defaultNewMilestones,
      };
      const res = await api.building.createProject(payload);
      if (res?.project) {
        setProjects((prev) => [res.project, ...prev]);
        setSelectedProjectId(res.project.id);
      } else {
        const localNew: FoundationProject = {
          id: `proj-${Date.now()}`,
          project_name: formProject.projectName.trim(),
          category: formProject.category,
          target_budget: formProject.targetBudget,
          current_funds: formProject.currentFunds,
          progress_percentage: formProject.progressPercentage,
          status: formProject.status,
          description: formProject.description.trim(),
          pic_name: formProject.picName.trim() || 'Tim Proyek Yayasan',
          target_completion_date: formProject.targetCompletionDate || undefined,
          milestones: defaultNewMilestones,
        };
        setProjects((prev) => [localNew, ...prev]);
        setSelectedProjectId(localNew.id);
      }

      showToast(`Proyek baru "${formProject.projectName}" berhasil didaftarkan!`);
      setShowAddModal(false);
      setFormProject({
        projectName: '',
        category: 'INFRASTRUKTUR',
        targetBudget: 0,
        currentFunds: 0,
        progressPercentage: 0,
        status: 'ON_PROGRESS',
        description: '',
        picName: '',
        targetCompletionDate: '',
      });
    } catch (err: any) {
      alert('Gagal menyimpan proyek: ' + (err.message || 'Terjadi kesalahan sistem.'));
    }
  };

  // Update Project Handler
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      await api.building.updateProject(editingProject.id, {
        projectName: editingProject.project_name,
        category: editingProject.category,
        targetBudget: Number(editingProject.target_budget) || 0,
        currentFunds: Number(editingProject.current_funds) || 0,
        progressPercentage: Number(editingProject.progress_percentage) || 0,
        status: editingProject.status,
        description: editingProject.description,
        picName: editingProject.pic_name,
        targetCompletionDate: editingProject.target_completion_date,
      });

      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...editingProject } : p))
      );

      showToast(`Proyek "${editingProject.project_name}" berhasil diperbarui.`);
      setEditingProject(null);
    } catch (err: any) {
      alert('Gagal memperbarui proyek: ' + err.message);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async (proj: FoundationProject) => {
    if (confirm(`Apakah Anda yakin ingin menghapus proyek "${proj.project_name}"?`)) {
      try {
        await api.building.deleteProject(proj.id);
        const updated = projects.filter((p) => p.id !== proj.id);
        setProjects(updated);
        if (selectedProjectId === proj.id && updated.length > 0) {
          setSelectedProjectId(updated[0].id);
        }
        showToast(`Proyek "${proj.project_name}" telah dihapus.`);
      } catch (err: any) {
        alert('Gagal menghapus proyek: ' + (err.message || 'Proyek memiliki kaitan data donasi.'));
      }
    }
  };

  return (
    <div>
      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 18 }}>
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: DAFTAR PROYEK YAYASAN (LIST PROYEK)               */}
      {/* ========================================================= */}
      {viewMode === 'list' && (
        <div>
          {/* PAGE HEADER */}
          <div className="page-header">
            <div className="page-header-text">
              <h2>Daftar Proyek Yayasan GMH</h2>
              <p>
                Portofolio program dan proyek strategis yayasan: Pembangunan Rumah Persekutuan, sarana kampus, armada misi pelayanan, dan proyek binaan alumni.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={fetchProjectData}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Memperbarui…' : 'Segarkan Data'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                id="btn-add-foundation-project"
                onClick={() => setShowAddModal(true)}
                style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> + Tambah Proyek Yayasan
              </button>
            </div>
          </div>

          {/* PORTFOLIO SUMMARY CARDS */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-label">TOTAL PROYEK YAYASAN</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
                {projects.length} Proyek
              </div>
              <div className="stat-card-meta">
                <strong>{totalActiveProjects}</strong> Sedang Berjalan Aktif
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">TOTAL TARGET ANGGARAN</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
                {formatRupiah(totalTargetAll)}
              </div>
              <div className="stat-card-meta">Seluruh Portofolio Strategis</div>
            </div>

            <div
              className="stat-card"
              style={
                {
                  '--stat-color': 'var(--gmh-green)',
                  '--stat-color-pale': 'var(--gmh-green-pale)',
                } as React.CSSProperties
              }
            >
              <div className="stat-card-label">DANA TERKUMPUL (FUNDRAISING)</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-green)' }}>
                {formatRupiah(totalCollectedAll)}
              </div>
              <div className="stat-card-meta">
                Tercapai: <strong>{overallFinancialPct}%</strong> dari Target
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">SISA KEBUTUHAN DANA</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: '#b91c1c' }}>
                {formatRupiah(Math.max(0, totalTargetAll - totalCollectedAll))}
              </div>
              <div className="stat-card-meta">Peluang Donasi Alumni</div>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ padding: '12px 18px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
                <Search className="search-box-icon" />
                <input
                  className="form-input"
                  id="search-projects"
                  placeholder="Cari nama proyek, deskripsi, atau PIC penanggung jawab…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 180 }}
                id="filter-project-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Semua Kategori Proyek</option>
                <option value="INFRASTRUKTUR">Infrastruktur & Gedung</option>
                <option value="FASILITAS">Fasilitas & Ruang Doa</option>
                <option value="MISI">Pelayanan Misi</option>
                <option value="PENDIDIKAN_IT">Pendidikan & IT</option>
                <option value="SOSIAL_BEASISWA">Sosial & Beasiswa</option>
                <option value="LAINNYA">Lainnya</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 160 }}
                id="filter-project-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="ON_PROGRESS">Sedang Berjalan</option>
                <option value="COMPLETED">Selesai 100%</option>
                <option value="PLANNING">Perencanaan</option>
              </select>
            </div>
          </div>

          {/* PROJECT LIST TABLE / CARDS */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderKanban size={18} color="var(--gmh-green)" />
                List Proyek Yayasan ({filteredProjects.length})
              </div>
              <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Klik tombol "Lihat Detail Proyek" untuk melihat progres detail & menambah tahapan kerja
              </span>
            </div>

            {filteredProjects.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gmh-text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div>Tidak ada proyek yang sesuai dengan kriteria pencarian.</div>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {paginatedProjects.map((p, idx) => {
                  const catKey = p.category || 'INFRASTRUKTUR';
                  const catStyle = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.LAINNYA;
                  const catLabel = CATEGORY_LABELS[catKey] || catKey;
                  const pTarget = Number(p.target_budget) || 0;
                  const pFunds = Number(p.current_funds) || 0;
                  const pFinPct = pTarget > 0 ? Math.min(100, Math.round((pFunds / pTarget) * 100)) : 0;
                  const milestonesCount = p.milestones?.length || 0;

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--gmh-border)',
                        borderRadius: 10,
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Row 1: Header & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 6,
                              background: catStyle.bg,
                              color: catStyle.color,
                              border: `1px solid ${catStyle.border}`,
                            }}
                          >
                            {catLabel}
                          </span>
                          <span
                            className="badge"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background:
                                p.status === 'COMPLETED'
                                  ? '#ecfdf5'
                                  : p.status === 'ON_PROGRESS'
                                  ? '#fef3c7'
                                  : '#f3f4f6',
                              color:
                                p.status === 'COMPLETED'
                                  ? '#065f46'
                                  : p.status === 'ON_PROGRESS'
                                  ? '#92400e'
                                  : '#374151',
                            }}
                          >
                            {p.status === 'COMPLETED'
                              ? 'Selesai 100%'
                              : p.status === 'ON_PROGRESS'
                              ? 'Sedang Berjalan'
                              : 'Perencanaan'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                            No. {(currentPage - 1) * pageSize + idx + 1}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: 12,
                              color: 'var(--gmh-text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => handleOpenEditProject(p)}
                            title="Edit data proyek"
                          >
                            <Edit size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: 12,
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => handleDeleteProject(p)}
                            title="Hapus proyek"
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontWeight: 600,
                              padding: '6px 14px',
                            }}
                            onClick={() => handleOpenDetail(p.id)}
                            id={`btn-open-detail-${p.id}`}
                          >
                            <Eye size={14} /> Lihat Detail Proyek <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Title & Description */}
                      <div>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            margin: '0 0 6px 0',
                            color: 'var(--gmh-text)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenDetail(p.id)}
                        >
                          {p.project_name}
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--gmh-text-muted)', margin: 0, lineHeight: 1.5 }}>
                          {p.description}
                        </p>
                      </div>

                      {/* Row 3: Metrics Progress Bars */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 16,
                          background: '#f9fafb',
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: '1px solid #f3f4f6',
                        }}
                      >
                        {/* Financial fundraising progress */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--gmh-text-muted)' }}>
                              Dana Terkumpul (Fundraising):
                            </span>
                            <strong style={{ color: 'var(--gmh-green)' }}>
                              {formatRupiah(pFunds)} ({pFinPct}%)
                            </strong>
                          </div>
                          <div className="progress-bar-wrapper" style={{ height: 8, borderRadius: 99 }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${pFinPct}%`, background: 'var(--gmh-green)' }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                            <span>Target: {formatRupiah(pTarget)}</span>
                            <span>Sisa: {formatRupiah(Math.max(0, pTarget - pFunds))}</span>
                          </div>
                        </div>

                        {/* Physical / Implementation Progress */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--gmh-text-muted)' }}>Progres Pelaksanaan Fisik:</span>
                            <strong style={{ color: 'var(--gmh-text)' }}>
                              {p.progress_percentage}% Selesai
                            </strong>
                          </div>
                          <div className="progress-bar-wrapper" style={{ height: 8, borderRadius: 99 }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(100, p.progress_percentage)}%`, background: 'var(--gmh-gold)' }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                            <span>Penanggung Jawab: {p.pic_name || 'Tim Yayasan GMH'}</span>
                            {milestonesCount > 0 && <span>{milestonesCount} Tahapan Kerja</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Component */}
            {filteredProjects.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 350, behavior: 'smooth' });
                }}
                onPageSizeChange={setPageSize}
                itemName="proyek yayasan"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: HALAMAN SENDIRI DETAIL PROYEK & TAHAPAN KERJA     */}
      {/* ========================================================= */}
      {viewMode === 'detail' && activeProject && (
        <div>
          {/* TOP NAVIGATION / ACTIONS BAR */}
          <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleBackToList}
              id="btn-back-to-project-list"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                padding: '7px 14px',
              }}
            >
              <ArrowLeft size={16} /> ← Kembali ke Daftar Proyek
            </button>

            {/* Quick Action Buttons on Detail Page */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleOpenProgressUpdate}
                id="btn-update-overall-progress"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              >
                <Sliders size={14} color="var(--gmh-gold)" /> Update Progres Proyek
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddMilestoneModal(true)}
                id="btn-add-milestone"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              >
                <Plus size={14} /> + Tambah Tahapan Kerja
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenEditProject(activeProject)}
                id="btn-edit-active-project"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Edit size={14} /> Edit Data Proyek
              </button>
            </div>
          </div>

          {/* PROJECT HEADER CARD */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: (CATEGORY_COLORS[activeProject.category || 'INFRASTRUKTUR'] || CATEGORY_COLORS.LAINNYA).bg,
                    color: (CATEGORY_COLORS[activeProject.category || 'INFRASTRUKTUR'] || CATEGORY_COLORS.LAINNYA).color,
                    border: `1px solid ${(CATEGORY_COLORS[activeProject.category || 'INFRASTRUKTUR'] || CATEGORY_COLORS.LAINNYA).border}`,
                  }}
                >
                  {CATEGORY_LABELS[activeProject.category || 'INFRASTRUKTUR'] || activeProject.category}
                </span>

                <span
                  className="badge"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background:
                      activeProject.status === 'COMPLETED'
                        ? '#ecfdf5'
                        : activeProject.status === 'ON_PROGRESS'
                        ? '#fef3c7'
                        : '#f3f4f6',
                    color:
                      activeProject.status === 'COMPLETED'
                        ? '#065f46'
                        : activeProject.status === 'ON_PROGRESS'
                        ? '#92400e'
                        : '#374151',
                  }}
                >
                  {activeProject.status === 'COMPLETED'
                    ? 'Selesai 100%'
                    : activeProject.status === 'ON_PROGRESS'
                    ? 'Sedang Berjalan'
                    : 'Perencanaan'}
                </span>

                <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                  ID: <code style={{ fontSize: 11 }}>{activeProject.id.slice(0, 8)}</code>
                </span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--gmh-text)' }}>
                {activeProject.project_name}
              </h2>
              <p style={{ color: 'var(--gmh-text-muted)', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.5, maxWidth: 850 }}>
                {activeProject.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  fontSize: 13,
                  color: 'var(--gmh-text-muted)',
                  borderTop: '1px solid var(--gmh-border)',
                  paddingTop: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={15} color="var(--gmh-green)" />
                  <span>Penanggung Jawab: <strong style={{ color: 'var(--gmh-text)' }}>{activeProject.pic_name || 'Tim Proyek Yayasan'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} color="var(--gmh-gold)" />
                  <span>Target Selesai: <strong style={{ color: 'var(--gmh-text)' }}>{formatDateId(activeProject.target_completion_date)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO METRIC CARDS WITH DIRECT INTERACTIVE PROGRESS CONTROLS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* Dana Terkumpul (Fundraising) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={17} color="var(--gmh-gold)" /> Dana Terkumpul (Fundraising)
                </div>
                <span className="badge badge-warning">{activeFinancialPct}% Tercapai</span>
              </div>
              <div className="card-body">
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--gmh-green-dark)',
                    marginBottom: 6,
                  }}
                >
                  {formatRupiah(activeCollected)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gmh-text-muted)', marginBottom: 16 }}>
                  Target Anggaran: <strong>{formatRupiah(activeTarget)}</strong>
                </div>
                <div className="progress-bar-wrapper progress-bar-gold" style={{ height: 12, borderRadius: 99 }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, activeFinancialPct)}%` }} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--gmh-text-muted)',
                    marginTop: 8,
                  }}
                >
                  <span>{activeFinancialPct}% terhimpun dari donatur & alumni</span>
                  <span>Sisa: {formatRupiah(activeRemaining)}</span>
                </div>
              </div>
            </div>

            {/* Progres Pelaksanaan Fisik + Quick Update Button */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardHat size={17} color="var(--gmh-gold)" /> Progres Pelaksanaan / Fisik
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleOpenProgressUpdate}
                  style={{ padding: '3px 10px', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <TrendingUp size={13} color="var(--gmh-green)" /> + Update Progres Fisik
                </button>
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--gmh-green-dark)',
                    }}
                  >
                    {activePhysicalPct}%
                  </div>
                  <span className="badge badge-success" style={{ fontSize: 11 }}>Status: {activeProject.status}</span>
                </div>

                <div style={{ fontSize: 13, color: 'var(--gmh-text-muted)', marginBottom: 16 }}>
                  Realisasi fisik pengerjaan di lapangan
                </div>
                <div className="progress-bar-wrapper" style={{ height: 12, borderRadius: 99 }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, activePhysicalPct)}%` }} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--gmh-text-muted)',
                    marginTop: 8,
                  }}
                >
                  <span>{activeMilestones.filter((m) => m.status === 'DONE').length} dari {activeMilestones.length} Tahapan Selesai</span>
                  <span>Target Selesai: {formatDateId(activeProject.target_completion_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAHAPAN & RENCANA KERJA (PIXEL-PERFECT FROM USER SCREENSHOT)              */}
          {/* ========================================================================= */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
                <Calendar size={18} color="var(--gmh-green)" />
                Tahapan & Rencana Kerja ({activeProject.project_name})
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddMilestoneModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '5px 14px' }}
                >
                  <Plus size={14} /> + Tambah Tahapan Baru
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {activeMilestones.map((m, i) => {
                  const isDone = m.status === 'DONE';
                  const isInProgress = m.status === 'IN_PROGRESS';
                  const isPending = m.status === 'PENDING' || !m.status;

                  return (
                    <div key={m.id || i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* Timeline Dot with Connecting Line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div
                          onClick={() => handleToggleMilestone(i)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: isDone
                              ? '#1B4332'
                              : isInProgress
                              ? '#d97706'
                              : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                          title="Klik nomor/ikon untuk mengubah status tahapan"
                        >
                          {isDone ? (
                            <CheckCircle2 size={16} color="#ffffff" />
                          ) : (
                            <span>{m.id || i + 1}</span>
                          )}
                        </div>

                        {/* Connecting Line between steps */}
                        {i < activeMilestones.length - 1 && (
                          <div
                            style={{
                              width: 2,
                              flex: 1,
                              minHeight: 28,
                              background: isDone ? '#10b981' : '#e5e7eb',
                              margin: '6px 0',
                            }}
                          />
                        )}
                      </div>

                      {/* Content block with progress bar underline */}
                      <div style={{ flex: 1, paddingBottom: 6 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--gmh-text)' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
                              {m.date.startsWith('Jadwal Target') ? m.date : `Jadwal Target: ${m.date}`}
                            </div>
                          </div>

                          {/* Pill Badge matching the user screenshot + Quick Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              onClick={() => handleToggleMilestone(i)}
                              style={{ cursor: 'pointer' }}
                              title="Klik untuk mengubah status tahapan (Selesai / Sedang Berjalan / Rencana)"
                            >
                              {isDone && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 12px',
                                    borderRadius: 99,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    border: '1px solid #a7f3d0',
                                  }}
                                >
                                  Selesai 100%
                                </span>
                              )}
                              {isInProgress && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 12px',
                                    borderRadius: 99,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
                                  }}
                                >
                                  Sedang Berjalan
                                </span>
                              )}
                              {isPending && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 12px',
                                    borderRadius: 99,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    background: '#f3f4f6',
                                    color: '#4b5563',
                                    border: '1px solid #e5e7eb',
                                  }}
                                >
                                  Rencana
                                </span>
                              )}
                            </div>

                            {/* Delete milestone action */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(i)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Hapus tahapan ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Horizontal progress bar underline matching screenshot */}
                        <div
                          style={{
                            marginTop: 10,
                            height: 6,
                            background: '#e5e7eb',
                            borderRadius: 99,
                            overflow: 'hidden',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: isDone ? '100%' : isInProgress ? `${m.pct || 65}%` : '0%',
                              background: isDone ? '#10b981' : isInProgress ? '#10b981' : 'transparent',
                              borderRadius: 99,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM RETURN BUTTON */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleBackToList}
              style={{ fontWeight: 600, padding: '8px 20px' }}
            >
              ← Kembali ke Daftar Proyek Yayasan
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING MODAL 1: TAMBAH TAHAPAN KERJA BARU                               */}
      {/* ========================================================================= */}
      {showAddMilestoneModal && activeProject && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowAddMilestoneModal(false)}
        >
          <div
            className="modal"
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">+ Tambah Tahapan Kerja ({activeProject.project_name})</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAddMilestoneModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveNewMilestone}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">
                    {fieldLabels['milestone'] || 'Nama Tahapan Kerja'} <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    list="building-milestones-datalist"
                    placeholder="Contoh: Pemasangan Plafon & Lampu LED"
                    value={formMilestone.label}
                    onChange={(e) => setFormMilestone({ ...formMilestone, label: e.target.value })}
                    required
                  />
                  <datalist id="building-milestones-datalist">
                    {(lookups?.buildingMilestones || [
                      'Peletakan Batu Pertama',
                      'Pondasi & Struktur Bawah',
                      'Struktur Kolom & Balok',
                      'Atap & Dinding Eksterior',
                      'Finishing Interior & MEP',
                      'Furnitur & Peresmian Gedung',
                    ]).map((ms) => (
                      <option key={ms} value={ms} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Jadwal / Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Jadwal Target: Juni 2026 atau Kuartal 3 2026"
                    value={formMilestone.date}
                    onChange={(e) => setFormMilestone({ ...formMilestone, date: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Status Tahapan</label>
                    <select
                      className="form-select"
                      value={formMilestone.status}
                      onChange={(e) =>
                        setFormMilestone({
                          ...formMilestone,
                          status: e.target.value as any,
                          pct: e.target.value === 'DONE' ? 100 : e.target.value === 'PENDING' ? 0 : 50,
                        })
                      }
                    >
                      <option value="IN_PROGRESS">Sedang Berjalan</option>
                      <option value="DONE">Selesai 100%</option>
                      <option value="PENDING">Rencana</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Persentase Progres (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-input"
                      value={formMilestone.status === 'DONE' ? 100 : formMilestone.status === 'PENDING' ? 0 : formMilestone.pct}
                      disabled={formMilestone.status !== 'IN_PROGRESS'}
                      onChange={(e) => setFormMilestone({ ...formMilestone, pct: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddMilestoneModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 600 }}
                >
                  Simpan Tahapan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING MODAL 2: UPDATE PROGRES FISIK & DANA PROYEK                       */}
      {/* ========================================================================= */}
      {showProgressUpdateModal && activeProject && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowProgressUpdateModal(false)}
        >
          <div
            className="modal"
            style={{
              maxWidth: 500,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Update Progres: {activeProject.project_name}</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowProgressUpdateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveProgressUpdate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Progres Fisik (%) <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-input"
                      value={formProgressUpdate.progressPercentage}
                      onChange={(e) =>
                        setFormProgressUpdate({
                          ...formProgressUpdate,
                          progressPercentage: Number(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Proyek</label>
                    <select
                      className="form-select"
                      value={formProgressUpdate.status}
                      onChange={(e) =>
                        setFormProgressUpdate({ ...formProgressUpdate, status: e.target.value })
                      }
                    >
                      <option value="ON_PROGRESS">Sedang Berjalan</option>
                      <option value="COMPLETED">Selesai 100%</option>
                      <option value="PLANNING">Perencanaan</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dana Terkumpul Saat Ini (Rp)</label>
                  <NominalInput
                    value={formProgressUpdate.currentFunds}
                    onChange={(val) => setFormProgressUpdate({ ...formProgressUpdate, currentFunds: val })}
                  />
                  <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                    Target anggaran proyek ini: <strong>{formatRupiah(activeTarget)}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowProgressUpdateModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 600 }}
                >
                  Simpan Perubahan Progres
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING MODAL 3: TAMBAH PROYEK YAYASAN BARU                               */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal"
            style={{
              maxWidth: 580,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">+ Tambah Proyek Yayasan Baru</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveNewProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">
                    Nama Proyek Yayasan <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    id="input-project-name"
                    placeholder="Contoh: Pembangunan Rumah Persekutuan, Pengadaan Armada Misi, dll."
                    value={formProject.projectName}
                    onChange={(e) => setFormProject({ ...formProject, projectName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Kategori Proyek</label>
                    <select
                      className="form-select"
                      id="select-project-category"
                      value={formProject.category}
                      onChange={(e) => setFormProject({ ...formProject, category: e.target.value })}
                    >
                      <option value="INFRASTRUKTUR">Infrastruktur & Gedung</option>
                      <option value="FASILITAS">Fasilitas & Ruang Doa</option>
                      <option value="MISI">Pelayanan Misi</option>
                      <option value="PENDIDIKAN_IT">Pendidikan & IT</option>
                      <option value="SOSIAL_BEASISWA">Sosial & Beasiswa</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Proyek</label>
                    <select
                      className="form-select"
                      id="select-project-status"
                      value={formProject.status}
                      onChange={(e) => setFormProject({ ...formProject, status: e.target.value })}
                    >
                      <option value="ON_PROGRESS">Sedang Berjalan</option>
                      <option value="PLANNING">Perencanaan</option>
                      <option value="COMPLETED">Selesai 100%</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Target Anggaran Total <span style={{ color: 'red' }}>*</span>
                    </label>
                    <NominalInput
                      value={formProject.targetBudget}
                      onChange={(val) => setFormProject({ ...formProject, targetBudget: val })}
                      placeholder="Rp 0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dana Awal Terkumpul</label>
                    <NominalInput
                      value={formProject.currentFunds}
                      onChange={(val) => setFormProject({ ...formProject, currentFunds: val })}
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Progres Fisik / Realisasi (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-input"
                      value={formProject.progressPercentage}
                      onChange={(e) =>
                        setFormProject({ ...formProject, progressPercentage: Number(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Tanggal Selesai</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formProject.targetCompletionDate}
                      onChange={(e) => setFormProject({ ...formProject, targetCompletionDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Penanggung Jawab / PIC</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Ir. P. Simanjuntak / Departemen Misi"
                    value={formProject.picName}
                    onChange={(e) => setFormProject({ ...formProject, picName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi & Tujuan Proyek</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Rincian peruntukan dan dampak proyek bagi pelayanan alumni dan adik binaan..."
                    value={formProject.description}
                    onChange={(e) => setFormProject({ ...formProject, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btn-submit-save-project"
                  style={{ fontWeight: 600 }}
                >
                  Simpan Proyek Yayasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING MODAL 4: EDIT DATA PROYEK                                        */}
      {/* ========================================================================= */}
      {editingProject && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setEditingProject(null)}
        >
          <div
            className="modal"
            style={{
              maxWidth: 580,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Edit Data Proyek: {editingProject.project_name}</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingProject(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">
                    Nama Proyek Yayasan <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProject.project_name}
                    onChange={(e) => setEditingProject({ ...editingProject, project_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Kategori Proyek</label>
                    <select
                      className="form-select"
                      value={editingProject.category || 'INFRASTRUKTUR'}
                      onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    >
                      <option value="INFRASTRUKTUR">Infrastruktur & Gedung</option>
                      <option value="FASILITAS">Fasilitas & Ruang Doa</option>
                      <option value="MISI">Pelayanan Misi</option>
                      <option value="PENDIDIKAN_IT">Pendidikan & IT</option>
                      <option value="SOSIAL_BEASISWA">Sosial & Beasiswa</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Proyek</label>
                    <select
                      className="form-select"
                      value={editingProject.status}
                      onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                    >
                      <option value="ON_PROGRESS">Sedang Berjalan</option>
                      <option value="PLANNING">Perencanaan</option>
                      <option value="COMPLETED">Selesai 100%</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Target Anggaran (Rp)</label>
                    <NominalInput
                      value={Number(editingProject.target_budget) || 0}
                      onChange={(val) => setEditingProject({ ...editingProject, target_budget: val })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dana Terkumpul (Rp)</label>
                    <NominalInput
                      value={Number(editingProject.current_funds) || 0}
                      onChange={(val) => setEditingProject({ ...editingProject, current_funds: val })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Progres Fisik / Realisasi (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-input"
                      value={editingProject.progress_percentage}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          progress_percentage: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Tanggal Selesai</label>
                    <input
                      type="date"
                      className="form-input"
                      value={
                        editingProject.target_completion_date
                          ? String(editingProject.target_completion_date).slice(0, 10)
                          : ''
                      }
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, target_completion_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Penanggung Jawab / PIC</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProject.pic_name || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, pic_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={editingProject.description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingProject(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 600 }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingProjectPage;
