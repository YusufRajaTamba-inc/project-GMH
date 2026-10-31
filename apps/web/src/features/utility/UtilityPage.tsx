import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  DollarSign,
  Briefcase,
  Building2,
  Calendar,
  Heart,
  Package,
  Plus,
  Trash2,
  CheckCircle,
  Edit3,
  Save,
  X,
  Search,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Layers,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../services/api';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

interface SystemMenu {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface LookupItem {
  id: string;
  category: string;
  code: string;
  label: string;
  metadata?: {
    systemMenu?: string;
    description?: string;
  };
  is_active: boolean;
}

interface FormConfigItem {
  id: string;
  feature_module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  options?: any;
}

const MENU_ICONS: Record<string, React.ReactNode> = {
  ALUMNI: <Users size={18} />,
  REGISTRASI: <UserPlus size={18} />,
  KEUANGAN: <DollarSign size={18} />,
  PAYROLL: <Briefcase size={18} />,
  BUILDING: <Building2 size={18} />,
  PROGRAMS: <Calendar size={18} />,
  PRAYER: <Heart size={18} />,
  ASSETS: <Package size={18} />,
  SEKRETARIAT: <Mail size={18} />,
};

export const MENU_CATEGORIES_PRESETS: Record<string, Array<{ key: string; label: string; target: string }>> = {
  ALUMNI: [
    { key: 'FACULTY', label: 'Fakultas Asal USU', target: 'Profil Anggota, Form Edit Anggota, Pendaftaran Mandiri' },
    { key: 'ALUMNI_REGION', label: 'Wilayah / Kring Alumni', target: 'Peta Wilayah, Form Anggota & Pendaftaran' },
    { key: 'KTB_GROUP', label: 'Kelompok Tumbuh Bersama (KTB)', target: 'Profil Alumni, Form Anggota' },
    { key: 'PROFESSION_CATEGORY', label: 'Profesi & Bidang Pekerjaan', target: 'Data Karir & Direktori Alumni' },
    { key: 'MARITAL_STATUS', label: 'Status Pernikahan', target: 'Data Keluarga & Pengingat HUT Pernikahan' },
  ],
  REGISTRASI: [
    { key: 'REG_STATUS', label: 'Status Tiket Registrasi', target: 'Meja Verifikasi Pendaftaran Mandiri' },
    { key: 'REG_REJECTION_REASON', label: 'Alasan Penolakan Pendaftaran', target: 'Modal Penolakan / Klarifikasi Berkas Tiket' },
  ],
  KEUANGAN: [
    { key: 'EXPENSE_CATEGORY', label: 'Kategori Kas Operasional', target: 'Buku Jurnal Kas Yayasan, Pagu Anggaran Operasional' },
    { key: 'DONATION_TYPE', label: 'Kategori Donasi Janji Iman', target: 'Form Janji Iman, Portofolio Donasi Anggota' },
    { key: 'PAYMENT_METHOD', label: 'Metode Pembayaran Kas/Bank', target: 'Entri Kas Masuk/Keluar, Setoran Angsuran' },
  ],
  BUILDING: [
    { key: 'BUILDING_MILESTONE', label: 'Fase Pembangunan Fisik', target: 'Progres Fisik Rumah Persekutuan' },
    { key: 'BUILDING_MATERIAL', label: 'Kategori Pengadaan Material', target: 'RAB & Belanja Bahan Bangunan' },
  ],
  PROGRAMS: [
    { key: 'PROGRAM_CATEGORY', label: 'Kategori Program & Acara', target: 'Agenda Yayasan, Jadwal Acara' },
    { key: 'ROSTER_ROLE', label: 'Penugasan Pelayan Program', target: 'Roster Pelayan Ibadah & Seminar' },
  ],
  PRAYER: [
    { key: 'PRAYER_CATEGORY', label: 'Kategori Pokok Doa', target: 'Form Permohonan Doa Jemaat' },
    { key: 'PRAYER_STATUS', label: 'Status Tindak Lanjut Doa', target: 'Meja Pelayanan Pastoral & Pendoa' },
  ],
  ASSETS: [
    { key: 'ASSET_CATEGORY', label: 'Kategori Inventaris Aset', target: 'Inventaris Sarana & Kode Barang' },
    { key: 'ASSET_LOCATION', label: 'Lokasi Penempatan Ruangan', target: 'Distribusi Ruangan Gedung Yayasan' },
    { key: 'PHYSICAL_CONDITION', label: 'Klasifikasi Kondisi Fisik', target: 'Pemeriksaan Kelaikan Sarana' },
  ],
  SEKRETARIAT: [
    { key: 'LETTER_CATEGORY', label: 'Klasifikasi Jenis Surat', target: 'Surat Keluar & Surat Masuk Sekretariat' },
    { key: 'LETTER_FORMAT', label: 'Format Penomoran Surat Keluar', target: 'Generator Nomor Otomatis Surat Keluar' },
  ],
};

const CATEGORY_NAMES: Record<string, string> = {
  // ALUMNI
  FACULTY: 'Fakultas Asal USU',
  ALUMNI_REGION: 'Wilayah / Kring Alumni',
  REGION: 'Wilayah / Kring Alumni',
  SECTOR_ZONE: 'Wilayah / Kring Alumni',
  KTB_GROUP: 'Kelompok Tumbuh Bersama (KTB)',
  KTB: 'Kelompok Tumbuh Bersama (KTB)',
  PROFESSION_CATEGORY: 'Profesi & Bidang Pekerjaan',
  PROFESSION: 'Profesi & Bidang Pekerjaan',
  MARITAL_STATUS: 'Status Pernikahan',

  // REGISTRASI
  REG_STATUS: 'Status Tiket Registrasi',
  REG_REJECTION_REASON: 'Alasan Penolakan Pendaftaran',
  REG_REJECT_REASON: 'Alasan Penolakan Pendaftaran',

  // KEUANGAN
  EXPENSE_CATEGORY: 'Kategori Kas Operasional',
  OPERATIONAL_CATEGORY: 'Kategori Kas Operasional',
  DONATION_TYPE: 'Kategori Donasi Janji Iman',
  DONATION_CATEGORY: 'Kategori Donasi Janji Iman',
  PAYMENT_METHOD: 'Metode Pembayaran Kas/Bank',

  // PAYROLL
  PAYROLL_ALLOWANCE: 'Komponen Tunjangan Staf',
  ALLOWANCE_TYPE: 'Komponen Tunjangan Staf',
  PAYROLL_DEDUCTION: 'Komponen Potongan Staf',
  DEDUCTION_TYPE: 'Komponen Potongan Staf',
  DEPARTMENT: 'Departemen / Bidang Kerja',

  // BUILDING
  BUILDING_MILESTONE: 'Fase Pembangunan Fisik',
  BUILDING_PHASE: 'Fase Pembangunan Fisik',
  BUILDING_MATERIAL: 'Kategori Pengadaan Material',
  PROCUREMENT_CATEGORY: 'Kategori Pengadaan Material',

  // PROGRAMS
  PROGRAM_CATEGORY: 'Kategori Program & Acara',
  ROSTER_ROLE: 'Penugasan Pelayan Program',
  PROGRAM_ROSTER_ROLE: 'Penugasan Pelayan Program',

  // PRAYER
  PRAYER_CATEGORY: 'Kategori Pokok Doa',
  PRAYER_STATUS: 'Status Tindak Lanjut Doa',

  // ASSETS
  ASSET_CATEGORY: 'Kategori Inventaris Aset',
  ASSET_LOCATION: 'Lokasi Penempatan Ruangan',
  PHYSICAL_CONDITION: 'Klasifikasi Kondisi Fisik',
  ASSET_CONDITION: 'Klasifikasi Kondisi Fisik',

  // SEKRETARIAT
  LETTER_CATEGORY: 'Klasifikasi Jenis Surat',
  LETTER_FORMAT: 'Format Penomoran Surat Keluar',
};

const CATEGORY_TARGET_MAP: Record<string, string> = {
  FACULTY: 'Form Anggota, Edit Anggota, Pendaftaran Mandiri',
  ALUMNI_REGION: 'Peta Wilayah, Form Anggota & Pendaftaran Mandiri',
  REGION: 'Peta Wilayah, Form Anggota & Pendaftaran Mandiri',
  SECTOR_ZONE: 'Peta Wilayah, Form Anggota & Pendaftaran Mandiri',
  KTB_GROUP: 'Profil Anggota, Form Edit Anggota',
  KTB: 'Profil Anggota, Form Edit Anggota',
  PROFESSION_CATEGORY: 'Direktori Profesi Alumni, Form Anggota',
  PROFESSION: 'Direktori Profesi Alumni, Form Anggota',
  MARITAL_STATUS: 'Data Keluarga, Pengingat HUT Pernikahan',
  REG_STATUS: 'Verifikasi Pendaftaran Mandiri',
  REG_REJECTION_REASON: 'Modal Penolakan Berkas Pendaftaran',
  REG_REJECT_REASON: 'Modal Penolakan Berkas Pendaftaran',
  EXPENSE_CATEGORY: 'Buku Jurnal Kas Operasional, Pagu Anggaran',
  OPERATIONAL_CATEGORY: 'Buku Jurnal Kas Operasional, Pagu Anggaran',
  DONATION_TYPE: 'Form Janji Iman & Donasi Pembangunan',
  DONATION_CATEGORY: 'Form Janji Iman & Donasi Pembangunan',
  PAYMENT_METHOD: 'Rekening Kas, Metode Setoran Angsuran',
  PAYROLL_ALLOWANCE: 'Struktur Slip Gaji & Tunjangan Staf',
  ALLOWANCE_TYPE: 'Struktur Slip Gaji & Tunjangan Staf',
  PAYROLL_DEDUCTION: 'Potongan BPJS & Pajak Slip Gaji',
  DEDUCTION_TYPE: 'Potongan BPJS & Pajak Slip Gaji',
  DEPARTMENT: 'Departemen Organisasi Yayasan GMH',
  BUILDING_MILESTONE: 'Progres Fisik Rumah Persekutuan',
  BUILDING_PHASE: 'Progres Fisik Rumah Persekutuan',
  BUILDING_MATERIAL: 'RAB & Pengadaan Material Proyek',
  PROCUREMENT_CATEGORY: 'RAB & Pengadaan Material Proyek',
  PROGRAM_CATEGORY: 'Agenda & Program Persekutuan GMH',
  ROSTER_ROLE: 'Roster Penugasan Pelayan Acara',
  PROGRAM_ROSTER_ROLE: 'Roster Penugasan Pelayan Acara',
  PRAYER_CATEGORY: 'Kategori Pokok Doa Jemaat',
  PRAYER_STATUS: 'Tindak Lanjut Pelayanan Pastoral Doa',
  ASSET_CATEGORY: 'Inventaris Sarana GMH & Kode Barang',
  ASSET_LOCATION: 'Penempatan Ruangan Sarana Gedung GMH',
  PHYSICAL_CONDITION: 'Klasifikasi Kelaikan Kondisi Sarana',
  ASSET_CONDITION: 'Klasifikasi Kelaikan Kondisi Sarana',
  LETTER_CATEGORY: 'Surat Keluar & Surat Masuk Sekretariat',
  LETTER_FORMAT: 'Generator Nomor Otomatis Surat Keluar',
};

const UtilityPage: React.FC = () => {
  const { refreshFromApi } = useDynamicConfig();

  const [menus, setMenus] = useState<SystemMenu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>('ALUMNI');
  const [lookupsByMenu, setLookupsByMenu] = useState<Record<string, LookupItem[]>>({});
  const [formConfigsByMenu, setFormConfigsByMenu] = useState<Record<string, FormConfigItem[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add Lookup Modal / Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-line editing for field labels
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Secretariat Numbering Configuration
  const [numberingConfig, setNumberingConfig] = useState({
    pattern: '{NOMOR}/{PREFIX}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}',
    prefix: 'GMH-PAKMK',
    padding: 3,
    counter: 1,
    resetPeriod: 'YEARLY',
  });
  const [numberingPreview, setNumberingPreview] = useState('');
  const [isSavingNumbering, setIsSavingNumbering] = useState(false);

  const calculatePreview = (
    pattern: string,
    prefix: string,
    counter: number,
    padding: number,
    sampleCategory: string = 'SK'
  ) => {
    const ROMAN: Record<number, string> = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
      7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
    };
    const now = new Date();
    const padded = String(counter || 1).padStart(padding || 3, '0');
    const m = now.getMonth() + 1;
    const rMonth = ROMAN[m] || String(m);
    const dMonth = String(m).padStart(2, '0');
    const y = String(now.getFullYear());

    let res = pattern || '{NOMOR}/{PREFIX}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}';
    res = res.replace(/\{NOMOR\}/gi, padded);
    res = res.replace(/\{NUMBER\}/gi, padded);
    res = res.replace(/\{PREFIX\}/gi, prefix || 'GMH-PAKMK');
    res = res.replace(/\{KODE_ORGANISASI\}/gi, prefix || 'GMH-PAKMK');
    res = res.replace(/\{CATEGORY\}/gi, sampleCategory);
    res = res.replace(/\{KATEGORI\}/gi, sampleCategory);
    res = res.replace(/\{ROMAN_MONTH\}/gi, rMonth);
    res = res.replace(/\{BULAN_ROMAWI\}/gi, rMonth);
    res = res.replace(/\{MONTH\}/gi, dMonth);
    res = res.replace(/\{BULAN_ANGKA\}/gi, dMonth);
    res = res.replace(/\{YEAR\}/gi, y);
    res = res.replace(/\{TAHUN\}/gi, y);
    return res;
  };

  const loadNumberingConfig = useCallback(async () => {
    try {
      const res = await api.secretariat.getNumberingConfig();
      if (res.success && res.config) {
        setNumberingConfig(res.config);
        setNumberingPreview(res.preview);
      }
    } catch (err) {
      console.error('Error loading numbering config:', err);
    }
  }, []);

  const handleSaveNumberingConfig = async () => {
    setIsSavingNumbering(true);
    try {
      const res = await api.secretariat.updateNumberingConfig(numberingConfig);
      if (res.success) {
        showToast('Format penomoran surat keluar berhasil disimpan ke database!');
        setNumberingPreview(res.preview);
        await loadData();
        refreshFromApi();
      }
    } catch (err: any) {
      showToast('Gagal menyimpan format penomoran: ' + err.message, 'error');
    } finally {
      setIsSavingNumbering(false);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menuRes, lookupRes, formRes] = await Promise.all([
        api.utility.getSystemMenus(),
        api.utility.getLookups(),
        api.utility.getFormConfigs(),
        loadNumberingConfig(),
      ]);

      if (menuRes?.data) {
        // Sembunyikan tab PAYROLL dari admin operasional harian
        setMenus(menuRes.data.filter((m: any) => m.id !== 'PAYROLL'));
      }

      if (lookupRes?.byMenu) {
        setLookupsByMenu(lookupRes.byMenu);
      }

      if (formRes) {
        if (formRes.byMenu) {
          setFormConfigsByMenu(formRes.byMenu);
        } else if (Array.isArray(formRes.configs || formRes.data)) {
          const grouped: Record<string, FormConfigItem[]> = {};
          (formRes.configs || formRes.data).forEach((cfg: FormConfigItem) => {
            const m = cfg.feature_module?.toUpperCase() || 'ALUMNI';
            if (!grouped[m]) grouped[m] = [];
            grouped[m].push(cfg);
          });
          setFormConfigsByMenu(grouped);
        }
      }
    } catch (err: any) {
      showToast('Gagal memuat konfigurasi utility: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current active menu lookups
  const currentMenuLookups = (lookupsByMenu[activeMenuId] || []).filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !categoryFilter || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Pagination for lookups
  const {
    currentPage: lookupPage,
    setCurrentPage: setLookupPage,
    pageSize: lookupPageSize,
    setPageSize: setLookupPageSize,
    totalPages: lookupTotalPages,
    paginatedItems: paginatedLookups,
  } = usePagination(currentMenuLookups, { initialPageSize: 10 });

  // Current active menu categories for dropdown
  const availableCategoriesInMenu = Array.from(
    new Set((lookupsByMenu[activeMenuId] || []).map((item) => item.category))
  );

  // Current active menu form configs
  const currentMenuConfigs = formConfigsByMenu[activeMenuId] || [];

  const handleCreateLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !newLabel.trim()) {
      showToast('Kategori dan Label opsi wajib diisi.', 'error');
      return;
    }

    const generatedCode =
      newCode.trim() ||
      newLabel
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_');

    setIsSubmitting(true);
    try {
      await api.utility.addLookup({
        category: newCategory.trim().toUpperCase(),
        code: generatedCode,
        label: newLabel.trim(),
        systemMenu: activeMenuId,
      });

      showToast(`Opsi "${newLabel.trim()}" berhasil ditambahkan ke menu ${activeMenuId}!`);
      setShowAddModal(false);
      setNewCategory('');
      setNewCode('');
      setNewLabel('');
      await loadData();
      refreshFromApi();
    } catch (err: any) {
      showToast('Gagal menambah lookup: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLookup = async (item: LookupItem) => {
    if (!window.confirm(`Hapus opsi "${item.label}" (${item.code}) dari menu ${activeMenuId}?`)) {
      return;
    }

    try {
      await api.utility.deleteLookup(item.id);
      showToast(`Opsi "${item.label}" telah dihapus.`);
      await loadData();
      refreshFromApi();
    } catch (err: any) {
      showToast('Gagal menghapus lookup: ' + err.message, 'error');
    }
  };

  const handleSaveFieldLabel = async (cfg: FormConfigItem) => {
    if (!editingLabelValue.trim()) return;

    try {
      await api.utility.updateFieldLabel({
        fieldKey: cfg.field_key,
        fieldLabel: editingLabelValue.trim(),
        featureModule: activeMenuId,
        isRequired: cfg.is_required,
      });

      showToast(`Label field "${cfg.field_key}" berhasil diperbarui menjadi "${editingLabelValue.trim()}"!`);
      setEditingFieldKey(null);
      await loadData();
      refreshFromApi();
    } catch (err: any) {
      showToast('Gagal mengubah label field: ' + err.message, 'error');
    }
  };

  const activeMenuInfo = menus.find((m) => m.id === activeMenuId) || {
    id: activeMenuId,
    label: activeMenuId,
    description: 'Konfigurasi master data dan label form',
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Sistem Utility & Kamus Data Master (Per Menu Sistem)</h2>
          <p>
            Konfigurasi seluruh master data (dropdown), kamus lookup, dan label form per 8 sistem menu yayasan tanpa hardcode UI
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadData}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Segarkan Data API
          </button>
          <span
            className="badge badge-success"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}
          >
            <ShieldCheck size={14} /> Full API Sync (PostgreSQL)
          </span>
        </div>
      </div>

      {toastMsg && (
        <div
          className={`alert ${toastMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: 16 }}
        >
          {toastMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 8 System Menus Navigator */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gmh-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pilih Menu Sistem Yayasan (8 Kelompok):
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {menus.map((menu) => {
            const count = (lookupsByMenu[menu.id] || []).length;
            const configCount = (formConfigsByMenu[menu.id] || []).length;
            const isActive = activeMenuId === menu.id;

            return (
              <button
                key={menu.id}
                onClick={() => {
                  setActiveMenuId(menu.id);
                  setCategoryFilter('');
                  setSearchQuery('');
                  setEditingFieldKey(null);
                }}
                className="card"
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: isActive ? '2px solid var(--gmh-green)' : '1px solid var(--gmh-border)',
                  background: isActive ? 'var(--gmh-green-pale)' : 'var(--gmh-card-bg)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isActive ? 'var(--gmh-green)' : 'var(--gmh-border-pale)',
                      color: isActive ? '#fff' : 'var(--gmh-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {MENU_ICONS[menu.id] || <Layers size={16} />}
                  </div>
                  <span className={`badge ${isActive ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: 11 }}>
                    {count} opsi
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: isActive ? 'var(--gmh-green-dark)' : 'var(--gmh-text)' }}>
                  {menu.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                  {configCount} field dinamis
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Menu Detail Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: '#0f172a', background: '#f1f5f9', padding: 8, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
              {MENU_ICONS[activeMenuId] || <Layers size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Menu Sistem: {activeMenuInfo.label}</div>
              <div style={{ fontSize: 13, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{activeMenuInfo.description}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Numbering Setup Card for SEKRETARIAT */}
      {activeMenuId === 'SEKRETARIAT' && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid #bfdbfe', background: '#f8fafc' }}>
          <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#eff6ff', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e40af' }}>
                <SlidersHorizontal size={18} /> Setup Dinamis Penomoran Otomatis Surat Keluar
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>
                Konfigurasi formula penomoran surat keluar yayasan secara dinamis di database PostgreSQL. Sistem secara otomatis menghasilkan nomor resmi saat surat dibuat.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveNumberingConfig}
                disabled={isSavingNumbering}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              >
                <Save size={14} /> {isSavingNumbering ? 'Menyimpan...' : 'Simpan Setup Penomoran'}
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(280px, 1fr)', gap: 24 }}>
              {/* Left Column: Form Setup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pola Formula Format Nomor Surat:</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Klik token untuk menyisipkan</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={numberingConfig.pattern}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNumberingConfig((prev) => ({ ...prev, pattern: val }));
                      setNumberingPreview(calculatePreview(val, numberingConfig.prefix, numberingConfig.counter, numberingConfig.padding));
                    }}
                    placeholder="{NOMOR}/{PREFIX}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}"
                    style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.03em' }}
                  />
                  {/* Clickable token chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {[
                      { token: '{NOMOR}', desc: 'No. Urut (001)' },
                      { token: '{PREFIX}', desc: 'Kode Organisasi' },
                      { token: '{CATEGORY}', desc: 'Kode Surat (SK/ST/SP)' },
                      { token: '{ROMAN_MONTH}', desc: 'Bulan Romawi (I-XII)' },
                      { token: '{MONTH}', desc: 'Bulan Angka (01-12)' },
                      { token: '{YEAR}', desc: 'Tahun (2026)' },
                    ].map((item) => (
                      <button
                        key={item.token}
                        type="button"
                        onClick={() => {
                          if (!numberingConfig.pattern.includes(item.token)) {
                            const newPat = `${numberingConfig.pattern}/${item.token}`.replace(/\/{2,}/g, '/');
                            setNumberingConfig((prev) => ({ ...prev, pattern: newPat }));
                            setNumberingPreview(calculatePreview(newPat, numberingConfig.prefix, numberingConfig.counter, numberingConfig.padding));
                          }
                        }}
                        className="badge badge-neutral"
                        style={{ cursor: 'pointer', fontSize: 11, padding: '4px 8px', border: '1px dashed #cbd5e1' }}
                        title={`Sisipkan ${item.desc}`}
                      >
                        <code>{item.token}</code> ({item.desc})
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Prefix Instansi:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={numberingConfig.prefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNumberingConfig((prev) => ({ ...prev, prefix: val }));
                        setNumberingPreview(calculatePreview(numberingConfig.pattern, val, numberingConfig.counter, numberingConfig.padding));
                      }}
                      placeholder="GMH-PAKMK"
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Digit Padding:</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      className="form-input"
                      value={numberingConfig.padding}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 3;
                        setNumberingConfig((prev) => ({ ...prev, padding: val }));
                        setNumberingPreview(calculatePreview(numberingConfig.pattern, numberingConfig.prefix, numberingConfig.counter, val));
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Counter Urut Berjalan:</label>
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      value={numberingConfig.counter}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setNumberingConfig((prev) => ({ ...prev, counter: val }));
                        setNumberingPreview(calculatePreview(numberingConfig.pattern, numberingConfig.prefix, val, numberingConfig.padding));
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Periode Reset:</label>
                    <select
                      className="form-select"
                      value={numberingConfig.resetPeriod}
                      onChange={(e) => setNumberingConfig((prev) => ({ ...prev, resetPeriod: e.target.value }))}
                    >
                      <option value="YEARLY">Tahunan (Tiap 1 Jan)</option>
                      <option value="MONTHLY">Bulanan (Tiap Awal Bulan)</option>
                      <option value="NEVER">Tidak Pernah Reset</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Dynamic Preview Box */}
              <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #cbd5e1', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 6 }}>
                    Live Preview Nomor Surat Keluar:
                  </div>
                  <div
                    style={{
                      background: '#f1f5f9',
                      border: '1.5px dashed #0284c7',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontFamily: 'monospace',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0369a1',
                      textAlign: 'center',
                      wordBreak: 'break-all',
                    }}
                  >
                    {numberingPreview || calculatePreview(numberingConfig.pattern, numberingConfig.prefix, numberingConfig.counter, numberingConfig.padding)}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                    <strong>Contoh untuk kategori lain:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, fontSize: 11.5 }}>
                      <div>• Surat Tugas: <code style={{ color: '#0f766e' }}>{calculatePreview(numberingConfig.pattern, numberingConfig.prefix, numberingConfig.counter, numberingConfig.padding, 'ST')}</code></div>
                      <div>• Surat Permohonan: <code style={{ color: '#0f766e' }}>{calculatePreview(numberingConfig.pattern, numberingConfig.prefix, numberingConfig.counter, numberingConfig.padding, 'SP')}</code></div>
                      <div>• Surat Undangan: <code style={{ color: '#0f766e' }}>{calculatePreview(numberingConfig.pattern, numberingConfig.prefix, numberingConfig.counter, numberingConfig.padding, 'SU')}</code></div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8' }}>
                  ℹ️ Nomor surat berikutnya otomatis bertambah saat tombol <em>Buat Surat Keluar</em> dikirim.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Master Lookups per System Menu */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Kamus Data & Dropdown Master ({activeMenuInfo.label})
            </div>
            <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
              Daftar master lookup yang digunakan pada dropdown form di menu ini ({currentMenuLookups.length} opsi aktif)
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari opsi / kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input form-input-sm"
                style={{ width: 200, paddingLeft: 32, fontSize: 12.5 }}
              />
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gmh-text-muted)', pointerEvents: 'none' }} />
            </div>

            {availableCategoriesInMenu.length > 0 && (
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 170, fontSize: 12.5 }}
              >
                <option value="">Semua Kategori</option>
                {availableCategoriesInMenu.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_NAMES[cat] || cat}
                  </option>
                ))}
              </select>
            )}

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setNewCategory(availableCategoriesInMenu[0] || '');
                setShowAddModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Tambah Opsi Lookup
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Kategori Master</th>
                <th>Label Tampilan</th>
                <th>Kode Sistem</th>
                <th>Target Modul Terintegrasi</th>
                <th>Menu Sistem</th>
                <th style={{ width: 90, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Memuat data master dari API...
                  </td>
                </tr>
              ) : currentMenuLookups.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Belum ada opsi master lookup untuk menu {activeMenuInfo.label}.
                  </td>
                </tr>
              ) : (
                paginatedLookups.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>{(lookupPage - 1) * lookupPageSize + idx + 1}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                        {CATEGORY_NAMES[item.category] || item.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{item.label}</td>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--gmh-border-pale)', padding: '2px 6px', borderRadius: 4 }}>
                        {item.code}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11.5,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        🎯 {CATEGORY_TARGET_MAP[item.category] || 'Modul Sistem GMH'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: 11 }}>
                        {item.metadata?.systemMenu || activeMenuId}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDeleteLookup(item)}
                        style={{ padding: '4px 8px', color: 'var(--gmh-danger)', borderColor: 'var(--gmh-danger)' }}
                        title="Hapus opsi ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={lookupPage}
          totalPages={lookupTotalPages}
          totalItems={currentMenuLookups.length}
          pageSize={lookupPageSize}
          onPageChange={setLookupPage}
          onPageSizeChange={setLookupPageSize}
          itemName="opsi lookup master"
        />
      </div>

      {/* Section 2: Dynamic Form Field Configurations per System Menu */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Konfigurasi Label Form & Metadata ({activeMenuInfo.label})</div>
            <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
              Ubah label kolom form secara dinamis di PostgreSQL tanpa koding ulang
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Field Key</th>
                <th>Label Tampilan Saat Ini</th>
                <th>Tipe Form</th>
                <th>Wajib Diisi</th>
                <th style={{ width: 140, textAlign: 'center' }}>Aksi Edit</th>
              </tr>
            </thead>
            <tbody>
              {currentMenuConfigs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Tidak ada konfigurasi field dinamis khusus untuk menu {activeMenuInfo.label}.
                  </td>
                </tr>
              ) : (
                currentMenuConfigs.map((cfg, idx) => {
                  const isEditing = editingFieldKey === cfg.field_key;

                  return (
                    <tr key={cfg.id}>
                      <td style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <code style={{ fontSize: 12, color: 'var(--gmh-green-dark)', fontWeight: 600 }}>
                          {cfg.field_key}
                        </code>
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editingLabelValue}
                              onChange={(e) => setEditingLabelValue(e.target.value)}
                              className="form-input"
                              style={{ height: 32, fontSize: 13, width: 260 }}
                              autoFocus
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveFieldLabel(cfg)}
                              style={{ padding: '4px 8px' }}
                              title="Simpan Label"
                            >
                              <Save size={13} />
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setEditingFieldKey(null)}
                              style={{ padding: '4px 8px' }}
                              title="Batal"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 500, fontSize: 13.5 }}>{cfg.field_label}</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                          {cfg.field_type}
                        </span>
                      </td>
                      <td>
                        {cfg.is_required ? (
                          <span className="badge badge-warning" style={{ fontSize: 11 }}>
                            Wajib
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                            Opsional
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!isEditing && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setEditingFieldKey(cfg.field_key);
                              setEditingLabelValue(cfg.field_label);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}
                          >
                            <Edit3 size={13} /> Ubah Label
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Lookup Option */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 500, animation: 'fadeIn 0.2s ease' }}>
            <div className="card-header">
              <div className="card-title">Tambah Opsi Lookup ({activeMenuInfo.label})</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateLookup}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Menu Sistem Terpilih</label>
                  <input
                    type="text"
                    disabled
                    value={`${activeMenuInfo.label} (${activeMenuId})`}
                    className="form-input"
                    style={{ background: 'var(--gmh-border-pale)' }}
                  />
                </div>

                <div>
                  <label className="form-label">
                    Kategori Lookup <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <div style={{ marginBottom: 6 }}>
                    <select
                      className="form-select"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ fontSize: 13 }}
                    >
                      <option value="">-- Pilih Kategori Preset Menu Ini --</option>
                      {(MENU_CATEGORIES_PRESETS[activeMenuId] || []).map((preset) => (
                        <option key={preset.key} value={preset.key}>
                          {preset.label} — [{preset.target}]
                        </option>
                      ))}
                      {availableCategoriesInMenu
                        .filter((cat) => !(MENU_CATEGORIES_PRESETS[activeMenuId] || []).some((p) => p.key === cat))
                        .map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_NAMES[cat] || cat} ({cat})
                          </option>
                        ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Atau ketik nama kategori kustom (contoh: KTB_GROUP, FACULTY)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-input"
                    required
                  />
                  {newCategory && (
                    <div style={{ fontSize: 11.5, color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
                      🎯 <strong>Target Modul Terintegrasi:</strong> {CATEGORY_TARGET_MAP[newCategory] || 'Modul Sistem GMH'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Label Tampilan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Fakultas Kedokteran Gigi"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Kode Sistem (Opsional, otomatis digenerate)</label>
                  <input
                    type="text"
                    placeholder="Contoh: FKG (kosongkan untuk generate otomatis)"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div
                className="card-footer"
                style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px' }}
              >
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan ke API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilityPage;
