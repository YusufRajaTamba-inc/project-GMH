import { query } from '../../shared/sql.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import {
  GetLookupsQueryInput,
  AddLookupInput,
  GetFormConfigsQueryInput,
  UpdateFieldLabelInput,
} from './utility.schema.js';

export const SYSTEM_MENUS = [
  { id: 'ALUMNI', label: 'Alumni & Keanggotaan', icon: 'Users', description: 'Master data fakultas USU, wilayah alumni, KTB, profesi, dan status pernikahan' },
  { id: 'REGISTRASI', label: 'Pendaftaran Mandiri', icon: 'UserPlus', description: 'Master status tiket verifikasi, validasi NIK, dan alasan penolakan' },
  { id: 'KEUANGAN', label: 'Keuangan & Donasi', icon: 'DollarSign', description: 'Chart of Accounts, pos kas operasional, kategori donasi janji iman, dan metode pembayaran' },
  { id: 'PAYROLL', label: 'Penggajian & HRD', icon: 'Briefcase', description: 'Komponen tunjangan jabatan/misi, potongan BPJS/PPh, dan struktur departemen' },
  { id: 'BUILDING', label: 'Rumah Persekutuan', icon: 'Building2', description: 'Milestone fase pembangunan fisik dan kategori pengadaan material' },
  { id: 'PROGRAMS', label: 'Program & Acara', icon: 'Calendar', description: 'Kategori agenda persekutuan/seminar dan penugasan roster pelayan' },
  { id: 'PRAYER', label: 'Permohonan Doa', icon: 'Heart', description: 'Kategori pokok doa jemaat/alumni dan status tindak lanjut pastoral' },
  { id: 'ASSETS', label: 'Inventaris Sarana', icon: 'Package', description: 'Kategori inventaris aset, penempatan ruangan, dan klasifikasi kondisi fisik' },
  { id: 'SEKRETARIAT', label: 'Sekretariat & Persuratan', icon: 'Mail', description: 'Format penomoran surat keluar, kode klasifikasi surat, dan tata kelola surat masuk' },
];

export const CATEGORY_CANONICAL_MAP: Record<string, string> = {
  // ALUMNI
  REGION: 'ALUMNI_REGION',
  ALUMNI_REGION: 'ALUMNI_REGION',
  SECTOR_ZONE: 'ALUMNI_REGION',
  KTB: 'KTB_GROUP',
  KTB_GROUP: 'KTB_GROUP',
  PROFESSION: 'PROFESSION_CATEGORY',
  PROFESSION_CATEGORY: 'PROFESSION_CATEGORY',
  FACULTY: 'FACULTY',
  MARITAL_STATUS: 'MARITAL_STATUS',

  // REGISTRASI
  REG_STATUS: 'REG_STATUS',
  REG_REJECT_REASON: 'REG_REJECTION_REASON',
  REG_REJECTION_REASON: 'REG_REJECTION_REASON',

  // KEUANGAN
  OPERATIONAL_CATEGORY: 'EXPENSE_CATEGORY',
  EXPENSE_CATEGORY: 'EXPENSE_CATEGORY',
  DONATION_CATEGORY: 'DONATION_TYPE',
  DONATION_TYPE: 'DONATION_TYPE',
  PAYMENT_METHOD: 'PAYMENT_METHOD',

  // PAYROLL
  ALLOWANCE_TYPE: 'PAYROLL_ALLOWANCE',
  PAYROLL_ALLOWANCE: 'PAYROLL_ALLOWANCE',
  DEDUCTION_TYPE: 'PAYROLL_DEDUCTION',
  PAYROLL_DEDUCTION: 'PAYROLL_DEDUCTION',
  DEPARTMENT: 'DEPARTMENT',

  // BUILDING
  BUILDING_PHASE: 'BUILDING_MILESTONE',
  BUILDING_MILESTONE: 'BUILDING_MILESTONE',
  PROCUREMENT_CATEGORY: 'BUILDING_MATERIAL',
  BUILDING_MATERIAL: 'BUILDING_MATERIAL',

  // PROGRAMS
  PROGRAM_CATEGORY: 'PROGRAM_CATEGORY',
  PROGRAM_ROSTER_ROLE: 'ROSTER_ROLE',
  ROSTER_ROLE: 'ROSTER_ROLE',

  // PRAYER
  PRAYER_CATEGORY: 'PRAYER_CATEGORY',
  PRAYER_STATUS: 'PRAYER_STATUS',

  // ASSETS
  ASSET_CATEGORY: 'ASSET_CATEGORY',
  ASSET_LOCATION: 'ASSET_LOCATION',
  ASSET_CONDITION: 'PHYSICAL_CONDITION',
  PHYSICAL_CONDITION: 'PHYSICAL_CONDITION',

  // SEKRETARIAT
  LETTER_CATEGORY: 'LETTER_CATEGORY',
  LETTER_FORMAT: 'LETTER_FORMAT',
};

export const CATEGORY_ALIASES: Record<string, string[]> = {
  ALUMNI_REGION: ['REGION', 'SECTOR_ZONE'],
  KTB_GROUP: ['KTB'],
  PROFESSION_CATEGORY: ['PROFESSION'],
  REG_REJECTION_REASON: ['REG_REJECT_REASON'],
  EXPENSE_CATEGORY: ['OPERATIONAL_CATEGORY'],
  DONATION_TYPE: ['DONATION_CATEGORY'],
  PAYROLL_ALLOWANCE: ['ALLOWANCE_TYPE'],
  PAYROLL_DEDUCTION: ['DEDUCTION_TYPE'],
  BUILDING_MILESTONE: ['BUILDING_PHASE'],
  BUILDING_MATERIAL: ['PROCUREMENT_CATEGORY'],
  ROSTER_ROLE: ['PROGRAM_ROSTER_ROLE'],
  PHYSICAL_CONDITION: ['ASSET_CONDITION'],
};

export async function getLookups(filters: GetLookupsQueryInput) {
  const { menu } = filters;

  const result = await query(
    `SELECT id, category, code, label, sort_order, is_active, metadata
     FROM system_lookups
     WHERE is_active = TRUE
     ORDER BY sort_order ASC, label ASC`
  );

  const groupedByCategory: Record<string, Array<{ id: string; code: string; label: string; menu: string }>> = {};
  const byMenu: Record<string, Array<any>> = {
    ALUMNI: [],
    REGISTRASI: [],
    KEUANGAN: [],
    PAYROLL: [],
    BUILDING: [],
    PROGRAMS: [],
    PRAYER: [],
    ASSETS: [],
    SEKRETARIAT: [],
  };

  for (const row of result.rows) {
    let menuGroup = row.metadata?.systemMenu;
    const canonical = CATEGORY_CANONICAL_MAP[row.category] || row.category;

    if (!menuGroup) {
      if (['FACULTY', 'ALUMNI_REGION', 'KTB_GROUP', 'MARITAL_STATUS', 'PROFESSION_CATEGORY'].includes(canonical)) menuGroup = 'ALUMNI';
      else if (['REG_STATUS', 'REG_REJECTION_REASON'].includes(canonical)) menuGroup = 'REGISTRASI';
      else if (['DONATION_TYPE', 'EXPENSE_CATEGORY', 'PAYMENT_METHOD'].includes(canonical)) menuGroup = 'KEUANGAN';
      else if (['PAYROLL_ALLOWANCE', 'PAYROLL_DEDUCTION', 'DEPARTMENT'].includes(canonical)) menuGroup = 'PAYROLL';
      else if (['BUILDING_MILESTONE', 'BUILDING_MATERIAL'].includes(canonical)) menuGroup = 'BUILDING';
      else if (['PROGRAM_CATEGORY', 'ROSTER_ROLE'].includes(canonical)) menuGroup = 'PROGRAMS';
      else if (['PRAYER_CATEGORY', 'PRAYER_STATUS'].includes(canonical)) menuGroup = 'PRAYER';
      else if (['ASSET_CATEGORY', 'ASSET_LOCATION', 'PHYSICAL_CONDITION'].includes(canonical)) menuGroup = 'ASSETS';
      else if (['LETTER_CATEGORY', 'LETTER_FORMAT'].includes(canonical)) menuGroup = 'SEKRETARIAT';
      else menuGroup = 'ALUMNI';
    }

    const lookupItem = {
      id: row.id,
      category: row.category,
      code: row.code,
      label: row.label,
      sortOrder: row.sort_order,
      systemMenu: menuGroup,
      metadata: row.metadata,
    };

    const addCategoryItem = (catKey: string) => {
      if (!groupedByCategory[catKey]) groupedByCategory[catKey] = [];
      if (!groupedByCategory[catKey].some((existing) => existing.id === row.id)) {
        groupedByCategory[catKey].push({ id: row.id, code: row.code, label: row.label, menu: menuGroup });
      }
    };

    addCategoryItem(row.category);

    if (canonical && canonical !== row.category) {
      addCategoryItem(canonical);
    }

    const aliases = CATEGORY_ALIASES[canonical] || [];
    for (const alias of aliases) {
      if (alias !== row.category) {
        addCategoryItem(alias);
      }
    }

    if (byMenu[menuGroup]) {
      byMenu[menuGroup].push(lookupItem);
    } else {
      byMenu[menuGroup] = [lookupItem];
    }
  }

  const filteredRows = menu
    ? result.rows.filter((r) => {
        const canonical = CATEGORY_CANONICAL_MAP[r.category] || r.category;
        let m = r.metadata?.systemMenu;
        if (!m) {
          if (['FACULTY', 'ALUMNI_REGION', 'KTB_GROUP', 'MARITAL_STATUS', 'PROFESSION_CATEGORY'].includes(canonical)) m = 'ALUMNI';
          else if (['REG_STATUS', 'REG_REJECTION_REASON'].includes(canonical)) m = 'REGISTRASI';
          else if (['DONATION_TYPE', 'EXPENSE_CATEGORY', 'PAYMENT_METHOD'].includes(canonical)) m = 'KEUANGAN';
          else if (['PAYROLL_ALLOWANCE', 'PAYROLL_DEDUCTION', 'DEPARTMENT'].includes(canonical)) m = 'PAYROLL';
          else if (['BUILDING_MILESTONE', 'BUILDING_MATERIAL'].includes(canonical)) m = 'BUILDING';
          else if (['PROGRAM_CATEGORY', 'ROSTER_ROLE'].includes(canonical)) m = 'PROGRAMS';
          else if (['PRAYER_CATEGORY', 'PRAYER_STATUS'].includes(canonical)) m = 'PRAYER';
          else if (['ASSET_CATEGORY', 'ASSET_LOCATION', 'PHYSICAL_CONDITION'].includes(canonical)) m = 'ASSETS';
          else if (['LETTER_CATEGORY', 'LETTER_FORMAT'].includes(canonical)) m = 'SEKRETARIAT';
          else m = 'ALUMNI';
        }
        return (m || '').toUpperCase() === menu.toUpperCase();
      })
    : result.rows;

  return {
    count: filteredRows.length,
    byMenu,
    menus: SYSTEM_MENUS,
    grouped: groupedByCategory,
    lookups: groupedByCategory,
    data: filteredRows,
    raw: filteredRows,
  };
}

export async function addLookup(input: AddLookupInput, actorUserId?: string | null) {
  const { category, code, label, systemMenu, sortOrder } = input;
  const rawCategory = category.toUpperCase().replace(/\s+/g, '_');
  const canonicalCategory = CATEGORY_CANONICAL_MAP[rawCategory] || rawCategory;
  const menu = (systemMenu || 'ALUMNI').toUpperCase();
  const order = Number(sortOrder) || 1;

  const insertRes = await query(
    `INSERT INTO system_lookups (category, code, label, sort_order, is_active, metadata)
     VALUES ($1, $2, $3, $4, TRUE, $5)
     ON CONFLICT (category, code) DO UPDATE 
     SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, metadata = EXCLUDED.metadata, is_active = TRUE
     RETURNING id, category, code, label, sort_order, metadata`,
    [
      canonicalCategory,
      code.toUpperCase().replace(/\s+/g, '_'),
      label.trim(),
      order,
      JSON.stringify({ systemMenu: menu }),
    ]
  );

  const created = insertRes.rows[0];
  await logAudit(actorUserId || null, 'INSERT', 'system_lookups', created.id, null, input);

  return {
    menu,
    canonicalCategory,
    lookup: created,
    data: created,
  };
}

export async function deleteLookup(id: string, actorUserId?: string | null) {
  await query(`UPDATE system_lookups SET is_active = FALSE WHERE id = $1`, [id]);
  await logAudit(actorUserId || null, 'DELETE', 'system_lookups', id);
}

export async function getFormConfigs(filters: GetFormConfigsQueryInput) {
  const { module, menu } = filters;
  const targetModule = (menu || module) as string;

  let queryText = `SELECT id, feature_module, field_key, field_label, field_type, lookup_category, placeholder, is_required, is_visible, sort_order
                   FROM form_field_configs WHERE is_visible = TRUE`;
  const params: any[] = [];

  if (targetModule) {
    queryText += ` AND feature_module = $1`;
    params.push(targetModule.toUpperCase());
  }

  queryText += ` ORDER BY feature_module ASC, sort_order ASC`;
  const result = await query(queryText, params);

  const byMenu: Record<string, Array<any>> = {
    ALUMNI: [],
    REGISTRASI: [],
    KEUANGAN: [],
    PAYROLL: [],
    BUILDING: [],
    PROGRAMS: [],
    PRAYER: [],
    ASSETS: [],
  };

  const labelMap: Record<string, string> = {};
  for (const r of result.rows) {
    const key = `${r.feature_module.toLowerCase()}.${r.field_key}`;
    labelMap[key] = r.field_label;
    labelMap[r.field_key] = r.field_label;

    if (r.feature_module === 'ALUMNI' || r.feature_module === 'MEMBERS') {
      labelMap[`member.${r.field_key}`] = r.field_label;
      labelMap[`alumni.${r.field_key}`] = r.field_label;
      labelMap[`members.${r.field_key}`] = r.field_label;
    }
    if (r.feature_module === 'KEUANGAN' || r.feature_module === 'FINANCE') {
      labelMap[`keuangan.${r.field_key}`] = r.field_label;
      labelMap[`finance.${r.field_key}`] = r.field_label;
      labelMap[`donation.${r.field_key}`] = r.field_label;
    }
    if (r.feature_module === 'BUILDING') {
      labelMap[`building.${r.field_key}`] = r.field_label;
    }
    if (r.feature_module === 'PRAYER') {
      labelMap[`prayer.${r.field_key}`] = r.field_label;
    }
    if (r.feature_module === 'ASSETS') {
      labelMap[`asset.${r.field_key}`] = r.field_label;
      labelMap[`assets.${r.field_key}`] = r.field_label;
    }
    if (r.feature_module === 'REGISTRASI') {
      labelMap[`registrasi.${r.field_key}`] = r.field_label;
      labelMap[`registration.${r.field_key}`] = r.field_label;
    }

    const modKey = r.feature_module.toUpperCase();
    if (byMenu[modKey]) {
      byMenu[modKey].push(r);
    } else {
      byMenu[modKey] = [r];
    }
  }

  return {
    count: result.rows.length,
    byMenu,
    configs: result.rows,
    data: result.rows,
    labelMap,
  };
}

export async function updateFieldLabel(input: UpdateFieldLabelInput, actorUserId?: string | null) {
  const { fieldKey, fieldLabel, featureModule, isRequired, fieldType } = input;
  const mod = (featureModule || 'ALUMNI').toUpperCase();
  const type = fieldType || 'TEXT';
  const reqFlag = isRequired !== undefined ? Boolean(isRequired) : false;
  const rawKey = fieldKey.includes('.') ? fieldKey.split('.').pop()! : fieldKey;

  const updateRes = await query(
    `INSERT INTO form_field_configs (feature_module, field_key, field_label, field_type, is_required)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (feature_module, field_key)
     DO UPDATE SET 
       field_label = EXCLUDED.field_label,
       field_type = COALESCE(EXCLUDED.field_type, form_field_configs.field_type),
       is_required = COALESCE(EXCLUDED.is_required, form_field_configs.is_required)
     RETURNING *`,
    [mod, rawKey, fieldLabel.trim(), type, reqFlag]
  );

  const updated = updateRes.rows[0];
  await logAudit(actorUserId || null, 'UPDATE', 'form_field_configs', updated.id, null, {
    fieldKey: rawKey,
    fieldLabel,
    mod,
  });

  return {
    mod,
    fieldLabel: fieldLabel.trim(),
    config: updated,
    data: updated,
  };
}
