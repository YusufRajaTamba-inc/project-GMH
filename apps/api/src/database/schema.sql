-- ============================================================================
-- YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
-- DATABASE SCHEMA DDL (PostgreSQL)
-- Referensi: KNOWLEDGE_DATA_INTEGRATION_FLOWS.md (Section 3.B)
-- ============================================================================

-- 1. MODUL IDENTITAS, RBAC & AUDIT LOG
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY, -- 'SUPER_ADMIN', 'DEWAN_PENGAWAS_PEMBINA', 'PENGURUS_HARIAN', 'BENDAHARA_YAYASAN', 'BENDAHARA_ADMIN', 'KOORDINATOR_DEPARTEMEN'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_key VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_id, module_key)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone_number VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
    position_title VARCHAR(100),
    birth_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,        -- 'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'PAYROLL_DISBURSE'
    entity_name VARCHAR(50) NOT NULL,   -- 'members', 'payroll', 'transactions'
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MODUL SISTEM UTILITY DINAMIS (LOOKUPS & DYNAMIC FIELDS ENGINE)
CREATE TABLE IF NOT EXISTS system_lookups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,      -- 'DONATION_TYPE', 'SECTOR_ZONE', 'FACULTY', 'MARITAL_STATUS', 'PRAYER_STATUS', 'EXPENSE_CATEGORY'
    code VARCHAR(50) NOT NULL,          -- 'DONASI_MISI', 'JANJI_IMAN', 'FMIPA', 'WILAYAH_MEDAN_SELAYANG'
    label VARCHAR(150) NOT NULL,        -- Admin bebas mengubah teks label kapan saja
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_code UNIQUE (category, code)
);

CREATE TABLE IF NOT EXISTS form_field_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_module VARCHAR(50) NOT NULL, -- 'MEMBERS', 'ALUMNI', 'FINANCE', 'ASSETS', 'PRAYER'
    field_key VARCHAR(50) NOT NULL,      -- 'profession_category', 'ktb_mentor', 'emergency_contact'
    field_label VARCHAR(150) NOT NULL,   -- Label dinamis di UI
    field_type VARCHAR(30) NOT NULL,     -- 'TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'BOOLEAN', 'FILE', 'TEXTAREA'
    lookup_category VARCHAR(50),         -- Jika dropdown, merujuk ke system_lookups.category
    placeholder VARCHAR(200),
    is_required BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    validation_regex VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_module_field UNIQUE (feature_module, field_key)
);

-- 3. MODUL ANGGOTA YAYASAN, ALUMNI (PA KMK) & KELUARGA
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number VARCHAR(50) UNIQUE NOT NULL, -- Format otomatis: GMH-YYYY-XXXXX
    nik VARCHAR(20) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(50),
    gender VARCHAR(10) NOT NULL,               -- 'M' / 'F' / 'Laki-laki' / 'Perempuan'
    birth_place VARCHAR(100),
    birth_date DATE NOT NULL,
    wedding_date DATE,                          -- Kolom utama widget Pengingat Ultah Pernikahan
    phone_number VARCHAR(30) NOT NULL,         -- Format WhatsApp: 628xxxxxxxx
    email VARCHAR(120),
    home_address TEXT NOT NULL,
    province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(10),
    
    -- Status Keanggotaan Yayasan
    member_type VARCHAR(30) DEFAULT 'ALUMNI',   -- 'ALUMNI', 'MAHASISWA', 'STAF_YAYASAN', 'MITRA_DONATUR', 'SIMPATISAN'
    sector_id UUID REFERENCES system_lookups(id), -- Wilayah / Kring Persekutuan Alumni
    
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',        -- 'ACTIVE', 'MUTATED', 'DECEASED'
    is_active BOOLEAN DEFAULT TRUE,
    membership_type VARCHAR(30) DEFAULT 'ALUMNI',
    custom_fields JSONB DEFAULT '{}'::jsonb,    -- Menampung seluruh field dinamis form
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_birth_date ON members (EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date));
CREATE INDEX IF NOT EXISTS idx_members_wedding_date ON members (EXTRACT(MONTH FROM wedding_date), EXTRACT(DAY FROM wedding_date));
CREATE INDEX IF NOT EXISTS idx_members_phone ON members (phone_number);

CREATE TABLE IF NOT EXISTS alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    faculty VARCHAR(100) NOT NULL,              -- Fakultas (Kedokteran, Teknik, MIPA, Pertanian, dll.)
    major VARCHAR(100) NOT NULL,                -- Jurusan / Program Studi
    entry_year INT NOT NULL,                    -- Stambuk (Tahun Masuk Kampus, e.g. 2014)
    graduation_year INT,                        -- Tahun Kelulusan
    current_profession VARCHAR(150),            -- Profesi / Bidang Pekerjaan saat ini
    company_name VARCHAR(150),                  -- Nama Tempat Kerja / Instansi
    ministry_field VARCHAR(150),                -- Minat / Bidang Pelayanan Alumni
    ktb_group_name VARCHAR(100),                -- Kelompok Tumbuh Bersama (KTB) asal saat mahasiswa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alumni_entry_year ON alumni_profiles (entry_year);
CREATE INDEX IF NOT EXISTS idx_alumni_faculty ON alumni_profiles (faculty);

CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_card_number VARCHAR(50) UNIQUE,      -- Nomor KK Anggota Yayasan
    family_name VARCHAR(150) NOT NULL,          -- Misal: Keluarga Alumni Silalahi / Panjaitan
    head_of_family_id UUID REFERENCES members(id),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship VARCHAR(30) NOT NULL,          -- 'KEPALA_KELUARGA', 'PASANGAN', 'ANAK', 'ORANG_TUA'
    CONSTRAINT uq_family_member UNIQUE (family_id, member_id)
);

-- 4. MODUL REGISTRASI MANDIRI (STAGING PUBLIK & APPROVAL ADMIN)
CREATE TABLE IF NOT EXISTS member_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code VARCHAR(30) UNIQUE NOT NULL, -- Kode Registrasi Publik (e.g. REG-GMH-202610-001)
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    birth_date DATE NOT NULL,
    wedding_date DATE,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(120),
    faculty VARCHAR(100),
    major VARCHAR(100),
    entry_year INT,                             -- Stambuk
    home_address TEXT NOT NULL,
    province VARCHAR(100),
    city VARCHAR(100),
    current_profession VARCHAR(150),
    marital_status VARCHAR(30),
    
    payload_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Seluruh isian form dinamis publik
    attachment_urls JSONB DEFAULT '[]'::jsonb,       -- Lampiran foto diri, kartu identitas
    
    status VARCHAR(20) DEFAULT 'PENDING',            -- 'PENDING', 'APPROVED', 'REJECTED'
    review_notes TEXT,                               -- Catatan review dari admin yayasan
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reg_status ON member_registrations (status);

-- 5. MODUL DEPARTEMEN YAYASAN, STAFF & MISI
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY, -- 'DEWAN_PEMBINA', 'DEWAN_PENGAWAS', 'PENGURUS_HARIAN', 'PELAYANAN_ALUMNI', 'PELAYANAN_PEMBINAAN', 'PELAYANAN_MISI', 'PENGEMBANGAN_BISNIS', 'KOMUNIKASI'
    name VARCHAR(150) NOT NULL,
    description TEXT,
    parent_id VARCHAR(50) REFERENCES departments(id),
    head_member_id UUID REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id),
    position_title VARCHAR(100) NOT NULL,       -- 'Staf Sekretariat', 'Misionaris Pos Misi', 'Koordinator Pembinaan'
    employment_type VARCHAR(30) NOT NULL,       -- 'FULL_TIME', 'PART_TIME', 'VOLUNTEER', 'MISSIONARY'
    base_salary DECIMAL(15, 2) DEFAULT 0,       -- Gaji pokok rahasia
    bank_name VARCHAR(50),
    bank_account_number VARCHAR(50),
    bank_account_holder VARCHAR(150),
    joined_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. MODUL PENGGAJIAN TERISOLASI / PAYROLL (KHUSUS BENDAHARA YAYASAN)
CREATE TABLE IF NOT EXISTS payroll_periods (
    id VARCHAR(10) PRIMARY KEY,                 -- 'YYYY-MM', misal '2026-10'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id VARCHAR(10) NOT NULL REFERENCES payroll_periods(id),
    staff_id UUID NOT NULL REFERENCES staff_members(id),
    base_salary DECIMAL(15, 2) NOT NULL,
    
    -- Komponen Tunjangan (JSON: misal {"tunjangan_misi": 750000, "transport": 300000})
    allowances JSONB DEFAULT '{}'::jsonb,
    total_allowance DECIMAL(15, 2) DEFAULT 0,
    
    -- Komponen Potongan (JSON: misal {"bpjs": 100000, "pinjaman_staf": 200000})
    deductions JSONB DEFAULT '{}'::jsonb,
    total_deduction DECIMAL(15, 2) DEFAULT 0,
    
    net_salary DECIMAL(15, 2) NOT NULL,         -- base_salary + total_allowance - total_deduction
    payment_status VARCHAR(20) DEFAULT 'PENDING',  -- 'PENDING', 'TRANSFERRED', 'CASH'
    payment_date TIMESTAMP,
    transfer_proof_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),        -- Wajib role BENDAHARA_YAYASAN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_payroll_period UNIQUE (payroll_period_id, staff_id)
);

-- 7. MODUL KEUANGAN YAYASAN, COA, KAS & PROYEK RUMAH PERSEKUTUAN
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id VARCHAR(50) PRIMARY KEY,                 -- e.g. '1-1010' (Kas Operasional Kantor), '1-1020' (Kas Bank Yayasan), '4-1010' (Donasi Umum), '4-2010' (Donasi Pembangunan Rumah Persekutuan)
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL,          -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    scope VARCHAR(30) NOT NULL,                 -- 'OPERASIONAL_KANTOR' (Bendahara Admin) vs 'KAS_BESAR_YAYASAN' (Bendahara Yayasan)
    parent_id VARCHAR(50) REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS building_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(150) NOT NULL,         -- 'Pembangunan Rumah Persekutuan GMH'
    target_budget DECIMAL(15, 2) NOT NULL,      -- Target biaya dana pembangunan
    current_funds DECIMAL(15, 2) DEFAULT 0,     -- Akumulasi dana terkumpul
    start_date DATE,
    target_completion_date DATE,
    progress_percentage INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'ON_PROGRESS',
    description TEXT
);

CREATE TABLE IF NOT EXISTS pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_project_id UUID REFERENCES building_projects(id),
    member_id UUID REFERENCES members(id),      -- Alumni / Donatur terdaftar
    donor_name VARCHAR(150),                    -- Donatur non-anggota/luar
    total_pledge DECIMAL(15, 2) NOT NULL,       -- Komitmen Janji Iman
    fulfilled_amount DECIMAL(15, 2) DEFAULT 0,  -- Realisasi cicilan donasi
    due_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',        -- 'ACTIVE', 'COMPLETED', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,  -- TX-GMH-202610-00129
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,         -- 'INCOME', 'EXPENSE'
    account_id VARCHAR(50) NOT NULL REFERENCES chart_of_accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'BANK_TRANSFER', -- 'CASH', 'BANK_TRANSFER', 'QRIS'
    bank_account_name VARCHAR(50),
    
    -- Batas Otoritas & Klasifikasi
    scope VARCHAR(30) NOT NULL,                    -- 'OPERASIONAL' (Bendahara Admin) vs 'YAYASAN_PUSAT' (Bendahara Yayasan)
    donor_member_id UUID REFERENCES members(id),   -- Jika donatur alumni beridentitas
    pledge_id UUID REFERENCES pledges(id),         -- Jika pembayaran Janji Iman Pembangunan
    
    proof_file_url TEXT,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tx_date_scope ON financial_transactions (transaction_date, scope);

-- 8. MODUL PROGRAM YAYASAN, PERSEKUTUAN ALUMNI & PERMOHONAN DOA
CREATE TABLE IF NOT EXISTS foundation_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_title VARCHAR(150) NOT NULL,        -- 'Persekutuan Doa Alumni Bulanan', 'Retret Pembinaan Mahasiswa', 'Rapat Kerja Tahunan Yayasan'
    program_category VARCHAR(50) NOT NULL,      -- 'PERSEKUTUAN_ALUMNI', 'PEMBINAAN_KAMPUS', 'MISI', 'SEMINAR_YAYASAN'
    event_datetime TIMESTAMP NOT NULL,
    location VARCHAR(150) NOT NULL,
    theme VARCHAR(255),
    speaker_name VARCHAR(150),
    bulletin_url TEXT,                          -- E-Buletin / Warta Yayasan Digital
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS program_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES foundation_programs(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id),
    role_in_event VARCHAR(50) NOT NULL,         -- 'PEMBICARA', 'MC_LITURGOS', 'PEMIMPIN_PUJIAN', 'MUSIK', 'DOKUMENTASI', 'TIM_DOA'
    confirmation_status VARCHAR(20) DEFAULT 'PENDING',
    CONSTRAINT uq_program_member_role UNIQUE (program_id, member_id, role_in_event)
);

CREATE TABLE IF NOT EXISTS prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_name VARCHAR(150) NOT NULL,
    sender_phone VARCHAR(30),
    sender_email VARCHAR(120),
    is_anonymous BOOLEAN DEFAULT FALSE,
    prayer_content TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'NEW',           -- 'NEW', 'BEING_PRAYED', 'ANSWERED'
    assigned_counselor_id UUID REFERENCES members(id), -- Staf / Pendoa pendamping yayasan
    counselor_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. MODUL MANAJEMEN ASET & RUMAH PERSEKUTUAN
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(50) UNIQUE NOT NULL,     -- AST-GMH-001
    asset_name VARCHAR(150) NOT NULL,
    category_id UUID REFERENCES system_lookups(id), -- 'SOUND_SYSTEM', 'MULTIMEDIA', 'KENDARAAN', 'GEDUNG_RUMAH_PERSEKUTUAN'
    asset_type VARCHAR(50) DEFAULT 'OPERATIONAL',
    quantity INT DEFAULT 1,
    available_quantity INT DEFAULT 1,
    purchase_date DATE,
    purchase_price DECIMAL(15, 2) DEFAULT 0,
    rental_price DECIMAL(15, 2) DEFAULT 0,
    physical_condition VARCHAR(30) DEFAULT 'GOOD',  -- 'GOOD', 'NEED_REPAIR', 'BROKEN'
    borrow_status VARCHAR(50) DEFAULT 'AVAILABLE',
    location_room VARCHAR(100),
    is_borrowable BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    borrower_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    borrower_name VARCHAR(150),
    borrower_phone VARCHAR(50),
    borrower_email VARCHAR(120),
    borrower_institution VARCHAR(200),
    loan_purpose VARCHAR(200) NOT NULL,
    loan_type VARCHAR(50) DEFAULT 'INTERNAL',
    rental_fee NUMERIC(15,2) DEFAULT 0,
    quantity_borrowed INT DEFAULT 1,
    notes TEXT,
    request_code VARCHAR(50),
    borrowed_at TIMESTAMP NOT NULL,
    expected_return_at TIMESTAMP NOT NULL,
    actual_return_at TIMESTAMP,
    condition_on_return VARCHAR(30),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. MODUL SEKRETARIAT & PERSURATAN YAYASAN
CREATE TABLE IF NOT EXISTS secretariat_outgoing_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_number VARCHAR(100) UNIQUE NOT NULL, -- Format dinamis: 001/GMH-PAKMK/SK/X/2026
    category_code VARCHAR(50) NOT NULL,         -- 'SK', 'ST', 'SP', 'SU', 'SKet', 'SPb', 'MOU', 'REK'
    category_label VARCHAR(150),
    letter_date DATE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    recipient_address TEXT,
    signer_name VARCHAR(150) NOT NULL,
    signer_position VARCHAR(150),
    attachment_count VARCHAR(50) DEFAULT '-',
    content_summary TEXT,
    file_url TEXT,
    status VARCHAR(30) DEFAULT 'TERKIRIM',       -- 'DRAFT', 'TERKIRIM', 'DIARSIPKAN'
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS secretariat_incoming_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_number VARCHAR(50) UNIQUE NOT NULL,   -- Format agenda: AG-2026-0001
    sender_letter_number VARCHAR(100) NOT NULL,
    sender_name VARCHAR(150) NOT NULL,
    sender_institution VARCHAR(200),
    subject VARCHAR(255) NOT NULL,
    letter_date DATE NOT NULL,
    received_date DATE NOT NULL,
    disposition_to VARCHAR(150),
    disposition_notes TEXT,
    status VARCHAR(30) DEFAULT 'DITERIMA',       -- 'DITERIMA', 'DIDISPOSISIKAN', 'DITINDAKLANJUTI', 'SELESAI', 'DIARSIPKAN'
    file_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. HAK AKSES PERAN (ROLE-BASED ACCESS CONTROL MATRIX)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_key VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_id, module_key)
);

-- 12. KEGIATAN PELAYANAN MISI
CREATE TABLE IF NOT EXISTS mission_activities (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    theme VARCHAR(255),
    budget_estimate NUMERIC(15, 2) DEFAULT 0,
    coordinator VARCHAR(150),
    location VARCHAR(255),
    event_date DATE,
    start_time TIME,
    end_time TIME,
    time_preview VARCHAR(100),
    description TEXT,
    media_drive_url TEXT,
    document_drive_url TEXT,
    status VARCHAR(50) DEFAULT 'ON_PROGRESS',
    cash_balance NUMERIC(15, 2) DEFAULT 0,
    transactions JSONB DEFAULT '[]'::jsonb,
    rundown JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    committees JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. KEPANITIAAN & JABATAN STRUKTUR ORGANISASI
CREATE TABLE IF NOT EXISTS committee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    committee_name VARCHAR(200) NOT NULL,
    role_title VARCHAR(150) NOT NULL,
    event_year INT,
    period VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'PENGURUS_HARIAN',
    function_description TEXT,
    hierarchy_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_position_tenures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES org_positions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    period VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    decree_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS division_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role_title VARCHAR(150) NOT NULL,
    period VARCHAR(100) DEFAULT '2024 - Sekarang',
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


