import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface Member {
  id: string;
  nia: string;
  name: string;
  nik?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  faculty: string;
  major: string;
  entryYear: number;
  graduationYear?: number;
  address?: string;
  city: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  profession: string;
  company?: string;
  ktb?: string;
  maritalStatus?: string;
  weddingDate?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    website?: string;
  };
  status: 'ACTIVE' | 'MUTATED' | 'DECEASED';
  type: 'ALUMNI' | 'MAHASISWA' | 'STAF_YAYASAN';
  createdAt?: string;
  customValues?: Record<string, any>;
}

export interface Registration {
  id: string;
  ticket: string;
  name: string;
  nik?: string;
  gender?: string;
  birthDate?: string;
  faculty: string;
  major: string;
  entryYear: number;
  wa: string;
  email: string;
  city: string;
  address?: string;
  profession?: string;
  company?: string;
  ktb?: string;
  maritalStatus?: string;
  weddingDate?: string;
  partnerName?: string;
  childrenCount?: number;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

interface MemberStoreContextValue {
  members: Member[];
  registrations: Registration[];
  isLoading: boolean;
  refreshFromApi: () => Promise<void>;
  addMember: (member: Omit<Member, 'id' | 'nia'>) => Member;
  addBulkMembers: (newMembers: Omit<Member, 'id' | 'nia'>[]) => number;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  submitPublicRegistration: (reg: Omit<Registration, 'id' | 'ticket' | 'submittedAt' | 'status'>) => string;
  approveRegistration: (regId: string) => Member | null;
  rejectRegistration: (regId: string, reason?: string) => void;
}

const INITIAL_MEMBERS: Member[] = [
  { id: '1', nia: 'GMH-2026-00001', name: 'Yusuf Panjaitan', nik: '1271012304950001', faculty: 'Fakultas Teknik', major: 'Teknik Informatika', entryYear: 2016, city: 'Medan', phone: '081234567890', email: 'yusuf.panjaitan@gmail.com', profession: 'Software Engineer', company: 'Tech Solusindo', ktb: 'KTB Paulus 2016', maritalStatus: 'Menikah', weddingDate: '2023-08-12', status: 'ACTIVE', type: 'ALUMNI' },
  { id: '2', nia: 'GMH-2026-00002', name: 'Mariana Hutabarat', nik: '1271025510970002', faculty: 'Fakultas MIPA', major: 'Biologi', entryYear: 2018, city: 'Jakarta', phone: '081298765432', email: 'mariana.h@gmail.com', profession: 'Peneliti Lingkungan', company: 'Balai Riset Hayati', ktb: 'KTB Ester 2018', maritalStatus: 'Lajang', status: 'ACTIVE', type: 'ALUMNI' },
  { id: '3', nia: 'GMH-2026-00003', name: 'Jekson Simanjuntak', nik: '1271031102940003', faculty: 'Fakultas Kedokteran', major: 'Kedokteran Umum', entryYear: 2015, city: 'Surabaya', phone: '081377889900', email: 'dr.jekson@gmail.com', profession: 'Dokter Spesialis', company: 'RS Siloam', ktb: 'KTB Timotius 2015', maritalStatus: 'Menikah', weddingDate: '2022-11-20', status: 'ACTIVE', type: 'ALUMNI' },
  { id: '4', nia: 'GMH-2026-00004', name: 'Debora Sinaga', nik: '1271044406980004', faculty: 'Fakultas Hukum', major: 'Ilmu Hukum', entryYear: 2019, city: 'Bandung', phone: '081222334455', email: 'debora.law@gmail.com', profession: 'Legal Corporate', company: 'Kantor Advokat Sinaga', ktb: 'KTB Rut 2019', maritalStatus: 'Lajang', status: 'ACTIVE', type: 'ALUMNI' },
  { id: '5', nia: 'GMH-2026-00005', name: 'Antonius Saragih', nik: '1271050908960005', faculty: 'Fakultas Pertanian', major: 'Agroteknologi', entryYear: 2017, city: 'Medan', phone: '081333445566', email: 'anton.saragih@gmail.com', profession: 'Wirausaha Agribisnis', company: 'CV Tani Makmur Berkat', ktb: 'KTB Barnabas 2017', maritalStatus: 'Menikah', weddingDate: '2024-05-18', status: 'ACTIVE', type: 'ALUMNI' },
  { id: '6', nia: 'GMH-2026-00006', name: 'Grace Silalahi', nik: '1271066703990006', faculty: 'Fakultas Ekonomi & Bisnis', major: 'Akuntansi', entryYear: 2020, city: 'Medan', phone: '081288990011', email: 'grace.silalahi@gmhpakmk.org', profession: 'Staf Administrasi & Keuangan', company: 'Yayasan Global Mission House', ktb: 'KTB Maria 2020', maritalStatus: 'Lajang', status: 'ACTIVE', type: 'STAF_YAYASAN' },
  { id: '7', nia: 'GMH-2026-00007', name: 'Ronald Manullang', nik: '1271071501930007', faculty: 'Fakultas Teknik', major: 'Teknik Sipil', entryYear: 2014, city: 'Jakarta', phone: '081311223344', email: 'ronald.m@construction.com', profession: 'Konsultan Struktur', company: 'PT Panca Mitra Karya', ktb: 'KTB Petrus 2014', maritalStatus: 'Menikah', weddingDate: '2021-02-14', status: 'MUTATED', type: 'ALUMNI' },
];

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: '1',
    ticket: 'REG-GMH-202610-0031',
    name: 'Samuel Ginting',
    nik: '1271081909990008',
    gender: 'Laki-laki',
    faculty: 'Fakultas Teknik',
    major: 'Teknik Elektro',
    entryYear: 2020,
    wa: '081234567890',
    email: 'samuel.ginting@email.com',
    city: 'Medan',
    address: 'Jl. Dr. Mansyur No. 45, Medan',
    profession: 'Network Engineer',
    company: 'PT Telekomunikasi',
    ktb: 'KTB Yohanes 2020',
    maritalStatus: 'Lajang',
    submittedAt: '2026-10-29',
    status: 'PENDING',
  },
  {
    id: '2',
    ticket: 'REG-GMH-202610-0032',
    name: 'Tiara Damanik',
    nik: '1271095512000009',
    gender: 'Perempuan',
    faculty: 'Fakultas MIPA',
    major: 'Matematika',
    entryYear: 2021,
    wa: '082233445566',
    email: 'tiara.damanik@email.com',
    city: 'Pematang Siantar',
    address: 'Jl. Sutomo No. 12, Pematang Siantar',
    profession: 'Guru Matematika',
    company: 'SMA Swasta Kalam Kudus',
    ktb: 'KTB Hana 2021',
    maritalStatus: 'Lajang',
    submittedAt: '2026-10-28',
    status: 'PENDING',
  },
  {
    id: '3',
    ticket: 'REG-GMH-202610-0033',
    name: 'Bintang Purba',
    nik: '1271100204980010',
    gender: 'Laki-laki',
    faculty: 'Fakultas Hukum',
    major: 'Ilmu Hukum',
    entryYear: 2019,
    wa: '085544332211',
    email: 'bintang.purba@email.com',
    city: 'Jakarta',
    address: 'Jl. Tebet Barat Dalam No. 8, Jakarta Selatan',
    profession: 'Associate Lawyer',
    company: 'Purba & Partners Law Office',
    ktb: 'KTB Daniel 2019',
    maritalStatus: 'Menikah',
    weddingDate: '2025-06-21',
    partnerName: 'dr. Sonya Sibarani',
    childrenCount: 0,
    submittedAt: '2026-10-27',
    status: 'PENDING',
  },
  {
    id: '4',
    ticket: 'REG-GMH-202610-0028',
    name: 'Melisa Simbolon',
    faculty: 'Fakultas Ekonomi & Bisnis',
    major: 'Manajemen',
    entryYear: 2018,
    wa: '081122334455',
    email: 'melisa@email.com',
    city: 'Balige',
    submittedAt: '2026-10-25',
    status: 'APPROVED',
  },
  {
    id: '5',
    ticket: 'REG-GMH-202610-0029',
    name: 'Halomoan Sihotang',
    faculty: 'Fakultas Pertanian',
    major: 'Ilmu Tanah',
    entryYear: 2017,
    wa: '089988776655',
    email: 'halo@email.com',
    city: 'Dolok Sanggul',
    submittedAt: '2026-10-24',
    status: 'REJECTED',
    rejectionReason: 'Format nomor NIK dan stambuk tidak sesuai verifikasi data alumni USU.',
  },
];

const MemberStoreContext = createContext<MemberStoreContextValue>({
  members: INITIAL_MEMBERS,
  registrations: INITIAL_REGISTRATIONS,
  isLoading: false,
  refreshFromApi: async () => {},
  addMember: () => INITIAL_MEMBERS[0],
  addBulkMembers: () => 0,
  updateMember: () => {},
  deleteMember: () => {},
  submitPublicRegistration: () => '',
  approveRegistration: () => null,
  rejectRegistration: () => {},
});

const STORAGE_KEY = 'gmh_member_store_v1';

export const MemberStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_members`);
      if (saved) {
        const parsed: Member[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Auto-heal any member with missing / dash / undefined NIA
          return parsed.map((m, idx) => {
            if (!m.nia || m.nia === '-' || m.nia === 'undefined' || m.nia === null) {
              if (m.name && m.name.toLowerCase().includes('josua')) {
                return { ...m, nia: 'GMH-2026-00010' };
              }
              const matchInit = INITIAL_MEMBERS.find((im) => im.name === m.name);
              if (matchInit?.nia) return { ...m, nia: matchInit.nia };
              const year = new Date().getFullYear();
              const seq = String(idx + 1).padStart(5, '0');
              return { ...m, nia: `GMH-${year}-${seq}` };
            }
            return m;
          });
        }
      }
      return INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_registrations`);
      return saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
    } catch {
      return INITIAL_REGISTRATIONS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_members`, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_registrations`, JSON.stringify(registrations));
  }, [registrations]);

  // Load from backend PostgreSQL API
  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      const [memRes, regRes] = await Promise.all([
        api.members.getAll().catch(() => null),
        api.registrations.getAll().catch(() => null),
      ]);

      const memList = memRes?.members || memRes?.data;
      if (Array.isArray(memList) && memList.length > 0) {
        const mappedMembers: Member[] = memList.map((row: any, idx: number) => {
          const rawNia = row.member_number || row.nia;
          const fallbackSeq = String(idx + 1).padStart(5, '0');
          const finalNia = (rawNia && rawNia !== '-' && rawNia !== 'undefined')
            ? rawNia
            : `GMH-${new Date().getFullYear()}-${fallbackSeq}`;
          return {
            id: row.id,
            nia: finalNia,
            name: row.full_name,
            nik: row.nik,
            gender: row.gender === 'M' ? 'Laki-laki' : row.gender === 'F' ? 'Perempuan' : row.gender,
            birthPlace: row.birth_place,
            birthDate: row.birth_date ? row.birth_date.split('T')[0] : undefined,
            faculty: row.faculty || 'Fakultas Teknik',
            major: row.major || '-',
            entryYear: Number(row.entry_year) || 2018,
            graduationYear: row.graduation_year ? Number(row.graduation_year) : undefined,
            address: row.home_address || row.address,
            city: row.city || 'Medan',
            province: row.province || 'Sumatera Utara',
            postalCode: row.postal_code,
            phone: row.phone_number,
            email: row.email,
            profession: row.current_profession || row.profession || 'Alumni Profesional',
            company: row.company_name || row.company,
            ktb: row.ktb_group_name || row.ktb_group || row.ktb,
            maritalStatus: row.custom_fields?.maritalStatus || (row.wedding_date ? 'Menikah' : (row.marital_status || 'Lajang')),
            weddingDate: row.wedding_date ? row.wedding_date.split('T')[0] : undefined,
            socialMedia: row.custom_fields?.socialMedia || row.custom_fields?.social_media || {},
            status: row.status || 'ACTIVE',
            type: row.member_type || 'ALUMNI',
            createdAt: row.created_at ? row.created_at.split('T')[0] : undefined,
            customValues: row.custom_fields,
          };
        });
        setMembers(mappedMembers);
      }

      const regList = regRes?.registrations || regRes?.data;
      if (Array.isArray(regList)) {
        const mappedRegs: Registration[] = regList.map((row: any) => ({
          id: row.id,
          ticket: row.registration_code || row.ticket_number || row.ticket || row.ticketNumber || (row.id ? `REG-GMH-${String(row.id).substring(0, 6).toUpperCase()}` : '-'),
          name: row.full_name,
          nik: row.nik,
          gender: row.gender === 'M' ? 'Laki-laki' : row.gender === 'F' ? 'Perempuan' : row.gender,
          birthDate: row.birth_date ? row.birth_date.split('T')[0] : undefined,
          faculty: row.faculty || 'Fakultas Teknik',
          major: row.major || 'Teknik Elektro',
          entryYear: Number(row.entry_year) || 2020,
          wa: row.phone_number || '-',
          email: row.email || '-',
          city: row.city || 'Medan',
          address: row.home_address || row.address,
          profession: row.current_profession || row.profession,
          company: row.company,
          ktb: row.ktb_group,
          maritalStatus: row.marital_status || 'Lajang',
          weddingDate: row.wedding_date ? row.wedding_date.split('T')[0] : undefined,
          partnerName: row.partner_name,
          childrenCount: Number(row.children_count) || 0,
          submittedAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: row.status || 'PENDING',
          rejectionReason: row.review_notes || row.notes || row.rejection_reason,
        }));
        setRegistrations(mappedRegs);
      }
    } catch (err) {
      console.warn('API sync warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromApi();
  }, [refreshFromApi]);

  const generateNextNia = (): string => {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    members.forEach((m) => {
      if (m.nia && m.nia.startsWith(`GMH-${year}-`)) {
        const parts = m.nia.split('-');
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });
    const nextSeq = Math.max(members.length + 1, maxSeq + 1);
    const padded = String(nextSeq).padStart(5, '0');
    return `GMH-${year}-${padded}`;
  };

  const addMember = (memberData: Omit<Member, 'id' | 'nia'>): Member => {
    const newMember: Member = {
      ...memberData,
      id: String(Date.now()),
      nia: generateNextNia(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMembers((prev) => [newMember, ...prev]);

    // Backend sync
    api.members.create({
      fullName: memberData.name,
      nik: memberData.nik,
      gender: memberData.gender === 'Perempuan' ? 'F' : 'M',
      email: memberData.email,
      phoneNumber: memberData.phone,
      faculty: memberData.faculty,
      major: memberData.major,
      entryYear: memberData.entryYear,
      profession: memberData.profession,
      company: memberData.company,
      city: memberData.city,
      ktbGroup: memberData.ktb,
      maritalStatus: memberData.maritalStatus,
      weddingDate: memberData.weddingDate,
      memberType: memberData.type,
      status: memberData.status,
    }).then((res) => {
      if (res?.member) {
        setMembers((prev) =>
          prev.map((m) => m.id === newMember.id ? { ...m, id: res.member.id, nia: res.member.nia } : m)
        );
      }
    }).catch((err) => console.error('Failed to create member via API:', err));

    return newMember;
  };

  const addBulkMembers = (newMembersData: Omit<Member, 'id' | 'nia'>[]): number => {
    const year = new Date().getFullYear();
    let currentCount = members.length;
    const createdList: Member[] = newMembersData.map((data, idx) => {
      currentCount++;
      return {
        ...data,
        id: `bulk-${Date.now()}-${idx}`,
        nia: `GMH-${year}-${String(currentCount).padStart(5, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
    });
    setMembers((prev) => [...createdList, ...prev]);

    const validRows = newMembersData.map((m) => ({
      full_name: m.name,
      nik: m.nik || '',
      gender: m.gender === 'Perempuan' ? 'F' : 'M',
      faculty: m.faculty,
      major: m.major,
      entry_year: m.entryYear,
      phone_number: m.phone || '',
      email: m.email || '',
      city: m.city,
      profession: m.profession,
      company: m.company || '',
      ktb_group: m.ktb || '',
    }));

    api.members.bulkCommit(validRows)
      .then(() => refreshFromApi())
      .catch((err) => console.error('Failed to bulk commit members via API:', err));

    return createdList.length;
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));

    try {
      await api.members.update(id, {
        fullName: updates.name,
        nik: updates.nik,
        gender: updates.gender,
        birthPlace: updates.birthPlace,
        birthDate: updates.birthDate,
        weddingDate: updates.maritalStatus === 'Lajang' ? null : (updates.weddingDate || null),
        maritalStatus: updates.maritalStatus,
        phoneNumber: updates.phone,
        email: updates.email,
        homeAddress: updates.address,
        city: updates.city,
        province: updates.province,
        postalCode: updates.postalCode,
        faculty: updates.faculty,
        major: updates.major,
        entryYear: updates.entryYear,
        graduationYear: updates.graduationYear,
        profession: updates.profession,
        company: updates.company,
        ktb: updates.ktb,
        memberType: updates.type,
        status: updates.status,
        socialMedia: updates.socialMedia,
      });
      await refreshFromApi();
    } catch (err) {
      console.error('Failed to update member via API:', err);
    }
  };

  const deleteMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.members.delete(id);
      await refreshFromApi();
    } catch (err) {
      console.error('Failed to delete member via API:', err);
    }
  };

  const submitPublicRegistration = (
    regData: Omit<Registration, 'id' | 'ticket' | 'submittedAt' | 'status'>
  ): string => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = String(registrations.length + 1).padStart(4, '0');
    const ticket = `REG-GMH-${yearMonth}-${seq}`;

    const newReg: Registration = {
      ...regData,
      id: `reg-${Date.now()}`,
      ticket,
      submittedAt: now.toISOString().split('T')[0],
      status: 'PENDING',
    };

    setRegistrations((prev) => [newReg, ...prev]);

    // Background sync to backend PostgreSQL
    api.registrations.publicRegister({
      fullName: regData.name,
      email: regData.email,
      phoneNumber: regData.wa,
      nik: regData.nik,
      gender: regData.gender === 'Perempuan' ? 'F' : 'M',
      birthDate: regData.birthDate,
      address: regData.address,
      city: regData.city,
      faculty: regData.faculty,
      major: regData.major,
      entryYear: regData.entryYear,
      profession: regData.profession,
      company: regData.company,
      ktbGroup: regData.ktb,
      maritalStatus: regData.maritalStatus,
      weddingDate: regData.weddingDate,
      partnerName: regData.partnerName,
      childrenCount: regData.childrenCount,
    }).then((res) => {
      if (res?.registration) {
        setRegistrations((prev) =>
          prev.map((r) => r.ticket === ticket ? { ...r, id: res.registration.id, ticket: res.registration.ticketNumber } : r)
        );
      }
    }).catch((err) => console.error('Failed to submit registration to API:', err));

    return ticket;
  };

  const approveRegistration = (regId: string): Member | null => {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return null;

    const newNia = generateNextNia();
    const newMember: Member = {
      id: `m-from-reg-${Date.now()}`,
      nia: newNia,
      name: reg.name,
      nik: reg.nik,
      gender: reg.gender,
      faculty: reg.faculty,
      major: reg.major,
      entryYear: reg.entryYear,
      city: reg.city,
      phone: reg.wa,
      email: reg.email,
      profession: reg.profession || 'Alumni Profesional',
      company: reg.company || '-',
      ktb: reg.ktb || '-',
      maritalStatus: reg.maritalStatus || 'Lajang',
      weddingDate: reg.weddingDate,
      status: 'ACTIVE',
      type: 'ALUMNI',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setMembers((prev) => [newMember, ...prev]);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status: 'APPROVED' } : r))
    );

    // Sync with API
    api.registrations.approve(regId).then((res) => {
      const officialNia = res?.member?.nia || res?.member?.memberNumber || res?.memberNumber || newNia;
      const officialId = res?.member?.id || newMember.id;
      setMembers((prev) =>
        prev.map((m) =>
          m.id === newMember.id || (reg.name && m.name.toLowerCase().trim() === reg.name.toLowerCase().trim())
            ? { ...m, id: officialId, nia: officialNia }
            : m
        )
      );
      refreshFromApi();
    }).catch((err) => {
      console.error('Failed to approve registration via API:', err);
      refreshFromApi();
    });

    return newMember;
  };

  const rejectRegistration = (regId: string, reason?: string) => {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? { ...r, status: 'REJECTED', rejectionReason: reason || 'Data tidak memenuhi syarat verifikasi' }
          : r
      )
    );

    api.registrations.reject(regId, reason || 'Data tidak memenuhi syarat verifikasi')
      .catch((err) => console.error('Failed to reject registration via API:', err));
  };

  return (
    <MemberStoreContext.Provider
      value={{
        members,
        registrations,
        isLoading,
        refreshFromApi,
        addMember,
        addBulkMembers,
        updateMember,
        deleteMember,
        submitPublicRegistration,
        approveRegistration,
        rejectRegistration,
      }}
    >
      {children}
    </MemberStoreContext.Provider>
  );
};

export const useMemberStore = () => useContext(MemberStoreContext);

