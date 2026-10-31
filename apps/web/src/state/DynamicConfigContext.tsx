import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface CustomFieldDef {
  id: string;
  module: 'MEMBERS' | 'FINANCE' | 'BUILDING' | 'PRAYER' | 'ASSETS';
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  isRequired: boolean;
}

export interface DynamicLookups {
  faculties: string[];
  alumniRegions: string[];
  ktbGroups: string[];
  professions: string[];
  maritalStatuses: string[];
  registrationStatuses: string[];
  rejectionReasons: string[];
  donationCategories: string[];
  operationalCategories: string[];
  paymentMethods: string[];
  allowanceTypes: string[];
  deductionTypes: string[];
  departments: string[];
  buildingMilestones: string[];
  buildingMaterials: string[];
  programCategories: string[];
  rosterRoles: string[];
  prayerCategories: string[];
  prayerStatuses: string[];
  assetCategories: string[];
  assetLocations: string[];
  assetConditions: string[];
}

export interface DynamicConfigContextValue {
  lookups: DynamicLookups;
  fieldLabels: Record<string, string>;
  customFields: CustomFieldDef[];
  rawLookups: Record<string, Array<{ id: string; code: string; label: string; menu: string }>>;
  isLoading: boolean;
  refreshFromApi: () => Promise<void>;
  getLookupsByCategory: (category: string) => string[];
  addLookupOption: (group: keyof DynamicLookups, value: string) => void;
  removeLookupOption: (group: keyof DynamicLookups, value: string) => void;
  updateFieldLabel: (key: string, newLabel: string) => void;
  resetFieldLabels: () => void;
  addCustomField: (field: Omit<CustomFieldDef, 'id'>) => void;
  removeCustomField: (id: string) => void;
}

const DEFAULT_LOOKUPS: DynamicLookups = {
  faculties: [
    'Fakultas Teknik',
    'Fakultas MIPA',
    'Fakultas Kedokteran',
    'Fakultas Hukum',
    'Fakultas Pertanian',
    'Fakultas Ekonomi & Bisnis',
    'Fakultas Ilmu Sosial & Politik',
    'Fakultas Ilmu Budaya',
    'Fakultas Kesehatan Masyarakat',
    'Fakultas Kehutanan',
    'Fakultas Farmasi',
    'Fakultas Psikologi',
    'Fakultas Ilmu Komputer & TI',
  ],
  alumniRegions: [
    'Medan & Sekitarnya',
    'Jabodetabek',
    'Bandung & Jawa Barat',
    'Surabaya & Jawa Timur',
    'Sumatera Bagian Utara',
    'Kepulauan Riau & Riau',
    'Luar Negeri',
  ],
  ktbGroups: [
    'KTB Filipi',
    'KTB Timotius',
    'KTB Efesus',
    'KTB Galilea',
    'KTB Betania',
    'KTB Yerusalem',
  ],
  professions: [
    'PNS / ASN',
    'BUMN / BUMD',
    'Karyawan Swasta',
    'Wiraswasta / Pengusaha',
    'Akademisi / Dosen / Guru',
    'Medis / Dokter / Nakes',
    'Pekabar Injil / Rohaniwan',
  ],
  maritalStatuses: [
    'Lajang',
    'Menikah',
    'Duda / Janda',
  ],
  registrationStatuses: [
    'Menunggu Verifikasi',
    'Disetujui',
    'Ditolak',
  ],
  rejectionReasons: [
    'Bukan Alumni USU',
    'Data Tidak Lengkap',
    'NIK Tidak Valid',
    'Permintaan Duplikat',
  ],
  donationCategories: [
    'Pembangunan Rumah Persekutuan',
    'Donasi Operasional Yayasan',
    'Janji Iman Bulanan',
    'Dana Pengutusan Misi',
    'Beasiswa Mahasiswa Binaan',
    'Aksi Kasih & Sosial',
  ],
  operationalCategories: [
    'Sewa Fasilitas & Kantor',
    'Perlengkapan ATK Kantor',
    'Utilitas (Listrik, Air & Internet)',
    'Konsumsi Persekutuan & Rapat',
    'Transport & Operasional Misi',
    'Honorarium Pembicara Seminar',
    'Pemeliharaan Gedung & Alat',
  ],
  paymentMethods: [
    'Transfer Bank (BCA Rekening Yayasan GMH)',
    'Transfer Bank Mandiri Yayasan',
    'QRIS Yayasan GMH',
    'Kas Tunai Kantor Yayasan',
  ],
  allowanceTypes: [
    'Tunjangan Jabatan',
    'Tunjangan Transport & Misi',
    'Tunjangan Kehadiran',
  ],
  deductionTypes: [
    'BPJS Kesehatan',
    'BPJS Ketenagakerjaan',
    'PPh 21',
  ],
  departments: [
    'Sekretariat & Operasional',
    'Pelayanan Misi & Mahasiswa',
    'Pembangunan & Sarana',
    'Keuangan & Akuntansi',
  ],
  buildingMilestones: [
    'Pembebasan Lahan',
    'Perizinan & AMDAL',
    'Pondasi & Struktur Bawah',
    'Pekerjaan Struktur Utama',
    'Finishing & Interior',
    'Peresmian & Serah Terima',
  ],
  buildingMaterials: [
    'Semen & Pasir',
    'Besi & Baja',
    'Bata & Mortar',
    'Keramik & Sanitair',
    'Elektrikal & Plumbing',
  ],
  programCategories: [
    'Ibadah Persekutuan Alumni',
    'Seminar & Pembinaan',
    'Aksi Pelayanan Sosial',
    'Rapat Kerja Pengurus',
  ],
  rosterRoles: [
    'Pengkhotbah / Pembicara',
    'Pemimpin Pujian (WL)',
    'Pemain Musik',
    'Singer / Song Leader',
    'Multimedia & Sound',
  ],
  prayerCategories: [
    'Kesehatan & Pemulihan',
    'Pelayanan Misi & Pekabar Injil',
    'Keluarga & Pernikahan',
    'Studi & Mahasiswa Kampus',
    'Pekerjaan & Usaha',
    'Pembangunan Rumah Persekutuan',
    'Ucapan Syukur',
  ],
  prayerStatuses: [
    'Permohonan Baru',
    'Sedang Didoakan',
    'Doa Terjawab',
  ],
  assetCategories: [
    'Elektronik & Multimedia',
    'Sound System & Alat Musik',
    'Furnitur & Perlengkapan Ruangan',
    'Fasilitas Ruang Doa & Konseling',
    'Kendaraan Operasional Yayasan',
    'Perangkat Komputer & IT',
  ],
  assetLocations: [
    'Ruang Sekretariat Lantai 1',
    'Aula Persekutuan Utama',
    'Ruang Doa & Konseling',
    'Gudang Sarana',
  ],
  assetConditions: [
    'Baik (Sangat Layak)',
    'Cukup (Perlu Perawatan)',
    'Rusak (Perlu Perbaikan)',
  ],
};

const DEFAULT_FIELD_LABELS: Record<string, string> = {
  'member.entryYear': 'Stambuk / Tahun Masuk',
  'member.faculty': 'Fakultas Asal USU',
  'member.major': 'Program Studi / Jurusan',
  'member.ktb': 'Kelompok Tumbuh Bersama (KTB)',
  'member.profession': 'Profesi / Pekerjaan Saat Ini',
  'member.weddingDate': 'Tanggal Pernikahan',
  'member.maritalStatus': 'Status Pernikahan',
  'donation.pledge': 'Komitmen Janji Iman',
  'building.progress': 'Progres Fisik Pembangunan',
  'prayer.category': 'Kategori Pokok Doa',
  'asset.code': 'Kode Inventaris Barang',
};

const DynamicConfigContext = createContext<DynamicConfigContextValue>({
  lookups: DEFAULT_LOOKUPS,
  fieldLabels: DEFAULT_FIELD_LABELS,
  customFields: [],
  rawLookups: {},
  isLoading: false,
  refreshFromApi: async () => {},
  getLookupsByCategory: () => [],
  addLookupOption: () => {},
  removeLookupOption: () => {},
  updateFieldLabel: () => {},
  resetFieldLabels: () => {},
  addCustomField: () => {},
  removeCustomField: () => {},
});

const STORAGE_KEY = 'gmh_dynamic_config_v2';

export const DynamicConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lookups, setLookups] = useState<DynamicLookups>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_lookups`);
      return saved ? { ...DEFAULT_LOOKUPS, ...JSON.parse(saved) } : DEFAULT_LOOKUPS;
    } catch {
      return DEFAULT_LOOKUPS;
    }
  });

  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_labels`);
      return saved ? { ...DEFAULT_FIELD_LABELS, ...JSON.parse(saved) } : DEFAULT_FIELD_LABELS;
    } catch {
      return DEFAULT_FIELD_LABELS;
    }
  });

  const [rawLookups, setRawLookups] = useState<Record<string, Array<{ id: string; code: string; label: string; menu: string }>>>({});

  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_custom_fields`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'cf-1',
          module: 'MEMBERS',
          fieldName: 'linkedin_url',
          fieldLabel: 'Tautan Profil LinkedIn',
          fieldType: 'text',
          isRequired: false,
        },
        {
          id: 'cf-2',
          module: 'MEMBERS',
          fieldName: 'blood_type',
          fieldLabel: 'Golongan Darah',
          fieldType: 'select',
          options: ['A', 'B', 'AB', 'O'],
          isRequired: false,
        },
      ];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_lookups`, JSON.stringify(lookups));
  }, [lookups]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_labels`, JSON.stringify(fieldLabels));
  }, [fieldLabels]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_custom_fields`, JSON.stringify(customFields));
  }, [customFields]);

  // Sync lookups & field labels with backend PostgreSQL API
  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      const [lookupRes, formRes] = await Promise.all([
        api.utility.getLookups().catch(() => null),
        api.utility.getFormConfigs().catch(() => null),
      ]);

      if (lookupRes?.grouped) {
        const grp = lookupRes.grouped;
        setRawLookups(grp);

        const extractLabels = (keys: string[], defaultList: string[]) => {
          for (const k of keys) {
            if (grp[k] && Array.isArray(grp[k]) && grp[k].length > 0) {
              return grp[k].map((l: any) => l.label);
            }
          }
          return defaultList;
        };

        setLookups((prev) => ({
          ...prev,
          faculties: extractLabels(['FACULTY'], prev.faculties),
          alumniRegions: extractLabels(['ALUMNI_REGION', 'REGION', 'SECTOR_ZONE'], prev.alumniRegions),
          ktbGroups: extractLabels(['KTB_GROUP', 'KTB'], prev.ktbGroups),
          professions: extractLabels(['PROFESSION_CATEGORY', 'PROFESSION'], prev.professions),
          maritalStatuses: extractLabels(['MARITAL_STATUS'], prev.maritalStatuses),
          registrationStatuses: extractLabels(['REG_STATUS'], prev.registrationStatuses),
          rejectionReasons: extractLabels(['REG_REJECTION_REASON', 'REG_REJECT_REASON'], prev.rejectionReasons),
          donationCategories: extractLabels(['DONATION_TYPE', 'DONATION_CATEGORY'], prev.donationCategories),
          operationalCategories: extractLabels(['EXPENSE_CATEGORY', 'OPERATIONAL_CATEGORY'], prev.operationalCategories),
          paymentMethods: extractLabels(['PAYMENT_METHOD'], prev.paymentMethods),
          allowanceTypes: extractLabels(['PAYROLL_ALLOWANCE', 'ALLOWANCE_TYPE'], prev.allowanceTypes),
          deductionTypes: extractLabels(['PAYROLL_DEDUCTION', 'DEDUCTION_TYPE'], prev.deductionTypes),
          departments: extractLabels(['DEPARTMENT'], prev.departments),
          buildingMilestones: extractLabels(['BUILDING_MILESTONE', 'BUILDING_PHASE'], prev.buildingMilestones),
          buildingMaterials: extractLabels(['BUILDING_MATERIAL', 'PROCUREMENT_CATEGORY'], prev.buildingMaterials),
          programCategories: extractLabels(['PROGRAM_CATEGORY'], prev.programCategories),
          rosterRoles: extractLabels(['ROSTER_ROLE', 'PROGRAM_ROSTER_ROLE'], prev.rosterRoles),
          prayerCategories: extractLabels(['PRAYER_CATEGORY'], prev.prayerCategories),
          prayerStatuses: extractLabels(['PRAYER_STATUS'], prev.prayerStatuses),
          assetCategories: extractLabels(['ASSET_CATEGORY'], prev.assetCategories),
          assetLocations: extractLabels(['ASSET_LOCATION'], prev.assetLocations),
          assetConditions: extractLabels(['PHYSICAL_CONDITION', 'ASSET_CONDITION'], prev.assetConditions),
        }));
      }

      if (formRes?.labelMap) {
        setFieldLabels((prev) => ({ ...prev, ...formRes.labelMap }));
      } else if (formRes?.configs && Array.isArray(formRes.configs)) {
        const labelsMap: Record<string, string> = {};
        formRes.configs.forEach((cfg: any) => {
          labelsMap[cfg.field_key] = cfg.field_label;
          labelsMap[`member.${cfg.field_key}`] = cfg.field_label;
          labelsMap[`alumni.${cfg.field_key}`] = cfg.field_label;
          labelsMap[`donation.${cfg.field_key}`] = cfg.field_label;
          labelsMap[`building.${cfg.field_key}`] = cfg.field_label;
          labelsMap[`prayer.${cfg.field_key}`] = cfg.field_label;
          labelsMap[`asset.${cfg.field_key}`] = cfg.field_label;
        });
        setFieldLabels((prev) => ({ ...prev, ...labelsMap }));
      }
    } catch (err) {
      console.warn('API utility refresh warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromApi();
  }, [refreshFromApi]);

  const getLookupsByCategory = useCallback(
    (category: string): string[] => {
      const upper = category.toUpperCase().trim();
      if (rawLookups[upper] && rawLookups[upper].length > 0) {
        return rawLookups[upper].map((l) => l.label);
      }
      return [];
    },
    [rawLookups]
  );

  const addLookupOption = (group: keyof DynamicLookups, value: string) => {
    const trimmed = value.trim();
    if (!trimmed || (lookups[group] && lookups[group].includes(trimmed))) return;
    setLookups((prev) => ({
      ...prev,
      [group]: [...(prev[group] || []), trimmed],
    }));

    // Map group to canonical category code in DB
    const categoryMap: Record<keyof DynamicLookups, string> = {
      faculties: 'FACULTY',
      alumniRegions: 'ALUMNI_REGION',
      ktbGroups: 'KTB_GROUP',
      professions: 'PROFESSION_CATEGORY',
      maritalStatuses: 'MARITAL_STATUS',
      registrationStatuses: 'REG_STATUS',
      rejectionReasons: 'REG_REJECTION_REASON',
      donationCategories: 'DONATION_TYPE',
      operationalCategories: 'EXPENSE_CATEGORY',
      paymentMethods: 'PAYMENT_METHOD',
      allowanceTypes: 'PAYROLL_ALLOWANCE',
      deductionTypes: 'PAYROLL_DEDUCTION',
      departments: 'DEPARTMENT',
      buildingMilestones: 'BUILDING_MILESTONE',
      buildingMaterials: 'BUILDING_MATERIAL',
      programCategories: 'PROGRAM_CATEGORY',
      rosterRoles: 'ROSTER_ROLE',
      prayerCategories: 'PRAYER_CATEGORY',
      prayerStatuses: 'PRAYER_STATUS',
      assetCategories: 'ASSET_CATEGORY',
      assetLocations: 'ASSET_LOCATION',
      assetConditions: 'PHYSICAL_CONDITION',
    };

    api.utility
      .addLookup({
        category: categoryMap[group] || group.toUpperCase(),
        code: trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        label: trimmed,
      })
      .then(() => refreshFromApi())
      .catch((err) => console.error('Failed to add lookup to API:', err));
  };

  const removeLookupOption = (group: keyof DynamicLookups, value: string) => {
    setLookups((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((item) => item !== value),
    }));
  };

  const updateFieldLabel = (key: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    setFieldLabels((prev) => ({
      ...prev,
      [key]: trimmed,
      [`member.${key}`]: trimmed,
      [`donation.${key}`]: trimmed,
    }));

    // Sync to API
    api.utility
      .updateFieldLabel({
        fieldKey: key,
        fieldLabel: trimmed,
      })
      .then(() => refreshFromApi())
      .catch((err) => console.error('Failed to update field label via API:', err));
  };

  const resetFieldLabels = () => {
    setFieldLabels(DEFAULT_FIELD_LABELS);
  };

  const addCustomField = (field: Omit<CustomFieldDef, 'id'>) => {
    const newField: CustomFieldDef = {
      ...field,
      id: `cf-${Date.now()}`,
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <DynamicConfigContext.Provider
      value={{
        lookups,
        fieldLabels,
        customFields,
        rawLookups,
        isLoading,
        refreshFromApi,
        getLookupsByCategory,
        addLookupOption,
        removeLookupOption,
        updateFieldLabel,
        resetFieldLabels,
        addCustomField,
        removeCustomField,
      }}
    >
      {children}
    </DynamicConfigContext.Provider>
  );
};

export const useDynamicConfig = () => useContext(DynamicConfigContext);

