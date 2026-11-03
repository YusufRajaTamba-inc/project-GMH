import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface Member {
  id: string;
  nia: string;
  name: string;
  nik?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  bloodType?: string;
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
  ministryInterest?: string;
  maritalStatus?: string;
  weddingDate?: string;
  partnerName?: string;
  childrenCount?: number;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    website?: string;
  };
  status: 'ACTIVE' | 'MUTATED' | 'DECEASED';
  type: 'ALUMNI' | 'MAHASISWA' | 'STAF_YAYASAN' | 'MITRA';
  createdAt?: string;
  customValues?: Record<string, any>;
}

export interface Registration {
  id: string;
  ticket: string;
  name: string;
  nik?: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  bloodType?: string;
  faculty: string;
  major: string;
  entryYear: number;
  graduationYear?: number;
  gradYear?: number;
  wa: string;
  email: string;
  city: string;
  province?: string;
  postalCode?: string;
  address?: string;
  profession?: string;
  company?: string;
  ktb?: string;
  ministryInterest?: string;
  maritalStatus?: string;
  weddingDate?: string;
  partnerName?: string;
  childrenCount?: number;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  memberType?: 'ALUMNI' | 'MAHASISWA' | 'STAF_YAYASAN' | 'MITRA';
}

interface MemberStoreContextValue {
  members: Member[];
  registrations: Registration[];
  isLoading: boolean;
  refreshFromApi: () => Promise<void>;
  addMember: (member: Omit<Member, 'id' | 'nia'>) => Promise<Member>;
  addBulkMembers: (newMembers: Omit<Member, 'id' | 'nia'>[]) => number;
  addBulkMembersChunked: (
    newMembers: Omit<Member, 'id' | 'nia'>[],
    onProgress?: (progress: {
      currentBatch: number;
      totalBatches: number;
      processed: number;
      total: number;
      percent: number;
    }) => void
  ) => Promise<{ success: boolean; count: number }>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  submitPublicRegistration: (reg: Omit<Registration, 'id' | 'ticket' | 'submittedAt' | 'status'>) => string;
  approveRegistration: (regId: string) => Promise<Member | null>;
  rejectRegistration: (regId: string, reason?: string) => Promise<void>;
}

const MemberStoreContext = createContext<MemberStoreContextValue>({
  members: [],
  registrations: [],
  isLoading: false,
  refreshFromApi: async () => {},
  addMember: async () => ({} as Member),
  addBulkMembers: () => 0,
  addBulkMembersChunked: async () => ({ success: true, count: 0 }),
  updateMember: async () => {},
  deleteMember: async () => {},
  submitPublicRegistration: () => '',
  approveRegistration: async () => null,
  rejectRegistration: async () => {},
});

const STORAGE_KEY = 'gmh_member_store_v2';

export const MemberStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_members`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_registrations`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    if (members.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_members`, JSON.stringify(members));
    }
  }, [members]);

  useEffect(() => {
    if (registrations.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_registrations`, JSON.stringify(registrations));
    }
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
      if (Array.isArray(memList)) {
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
            bloodType: row.blood_type || row.bloodType || row.custom_fields?.bloodType || row.custom_fields?.blood_type,
            faculty: row.faculty || '-',
            major: row.major || '-',
            entryYear: Number(row.entry_year) || 0,
            graduationYear: row.graduation_year ? Number(row.graduation_year) : undefined,
            address: row.home_address || row.address,
            city: row.city || '-',
            province: row.province || '-',
            postalCode: row.postal_code,
            phone: row.phone_number,
            email: row.email,
            profession: row.current_profession || row.profession || '-',
            company: row.company_name || row.company,
            ktb: row.ktb_group_name || row.ktb_group || row.ktb,
            ministryInterest: row.ministry_field || row.ministry_interest || row.custom_fields?.ministryInterest,
            maritalStatus: row.custom_fields?.maritalStatus || (row.wedding_date ? 'Menikah' : (row.marital_status || 'Lajang')),
            weddingDate: row.wedding_date ? row.wedding_date.split('T')[0] : undefined,
            partnerName: row.custom_fields?.partnerName || row.partner_name,
            childrenCount: row.custom_fields?.childrenCount !== undefined ? Number(row.custom_fields?.childrenCount) : undefined,
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
          nik: row.nik || row.payload_data?.nik,
          gender: row.gender === 'M' ? 'Laki-laki' : row.gender === 'F' ? 'Perempuan' : row.gender,
          birthPlace: row.birth_place || row.payload_data?.birthPlace,
          birthDate: row.birth_date ? row.birth_date.split('T')[0] : (row.payload_data?.birthDate ? row.payload_data.birthDate.split('T')[0] : undefined),
          bloodType: row.blood_type || row.bloodType || row.payload_data?.bloodType || row.payload_data?.blood_type,
          faculty: row.faculty || row.payload_data?.faculty || '-',
          major: row.major || row.payload_data?.major || '-',
          entryYear: Number(row.entry_year || row.payload_data?.entryYear) || 0,
          graduationYear: row.payload_data?.graduationYear ? Number(row.payload_data.graduationYear) : (row.payload_data?.gradYear ? Number(row.payload_data.gradYear) : undefined),
          gradYear: row.payload_data?.gradYear ? Number(row.payload_data.gradYear) : (row.payload_data?.graduationYear ? Number(row.payload_data.graduationYear) : undefined),
          wa: row.phone_number || row.payload_data?.phoneNumber || row.payload_data?.wa || '-',
          email: row.email || row.payload_data?.email || '-',
          city: row.city || row.payload_data?.city || '-',
          province: row.province || row.payload_data?.province || '-',
          postalCode: row.postal_code || row.payload_data?.postalCode,
          address: row.home_address || row.address || row.payload_data?.homeAddress,
          profession: row.current_profession || row.profession || row.payload_data?.profession,
          company: row.company || row.payload_data?.company,
          ktb: row.ktb_group || row.payload_data?.ktb,
          ministryInterest: row.payload_data?.ministryInterest || row.ministry_field,
          maritalStatus: row.marital_status || row.payload_data?.maritalStatus || 'Lajang',
          weddingDate: row.wedding_date ? row.wedding_date.split('T')[0] : (row.payload_data?.weddingDate ? row.payload_data.weddingDate.split('T')[0] : undefined),
          partnerName: row.partner_name || row.payload_data?.partnerName,
          childrenCount: Number(row.children_count || row.payload_data?.childrenCount || 0),
          socialMedia: row.payload_data?.socialMedia || {
            linkedin: row.payload_data?.linkedin,
            instagram: row.payload_data?.instagram,
            facebook: row.payload_data?.facebook,
          },
          submittedAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: row.status || 'PENDING',
          rejectionReason: row.review_notes || row.notes || row.rejection_reason,
          memberType: row.member_type || row.payload_data?.memberType || row.payload_data?.type || 'ALUMNI',
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
    if (isAuthenticated) {
      void refreshFromApi();
    }
  }, [isAuthenticated, user?.id, refreshFromApi]);

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

  const addMember = async (memberData: Omit<Member, 'id' | 'nia'>): Promise<Member> => {
    if (memberData.nik && memberData.nik.trim()) {
      const cleanNik = memberData.nik.trim();
      const existing = members.find((m) => m.nik && m.nik.trim() === cleanNik);
      if (existing) {
        throw new Error(
          `NIK ${cleanNik} sudah terdaftar atas nama ${existing.name} (${existing.nia}). Data anggota dengan NIK yang sama tidak dapat ditambahkan.`
        );
      }
    }

    try {
      const res = await api.members.create({
        fullName: memberData.name,
        nik: memberData.nik,
        gender: memberData.gender === 'Perempuan' ? 'F' : 'M',
        birthPlace: memberData.birthPlace,
        birthDate: memberData.birthDate,
        bloodType: memberData.bloodType,
        email: memberData.email,
        phoneNumber: memberData.phone,
        homeAddress: memberData.address,
        city: memberData.city,
        province: memberData.province,
        postalCode: memberData.postalCode,
        faculty: memberData.faculty,
        major: memberData.major,
        entryYear: memberData.entryYear,
        graduationYear: memberData.graduationYear,
        profession: memberData.profession,
        company: memberData.company,
        ktb: memberData.ktb,
        maritalStatus: memberData.maritalStatus,
        weddingDate: memberData.weddingDate,
        partnerName: memberData.partnerName,
        childrenCount: memberData.childrenCount,
        ministryInterest: memberData.ministryInterest,
        socialMedia: memberData.socialMedia,
        memberType: memberData.type,
        status: memberData.status,
      });

      return {
        ...memberData,
        id: res?.member?.id || String(Date.now()),
        nia: res?.member?.nia || res?.member?.member_number || generateNextNia(),
        createdAt: new Date().toISOString().split('T')[0],
      };
    } finally {
      await refreshFromApi();
    }
  };

  const addBulkMembersChunked = async (
    newMembersData: Omit<Member, 'id' | 'nia'>[],
    onProgress?: (progress: {
      currentBatch: number;
      totalBatches: number;
      processed: number;
      total: number;
      percent: number;
    }) => void
  ): Promise<{ success: boolean; count: number }> => {
    const BATCH_SIZE = 100;
    const total = newMembersData.length;
    if (total === 0) return { success: true, count: 0 };

    const totalBatches = Math.ceil(total / BATCH_SIZE);
    let processedCount = 0;

    for (let b = 0; b < totalBatches; b++) {
      const chunk = newMembersData.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const validRows = chunk.map((m) => ({
        name: m.name,
        full_name: m.name,
        nik: m.nik || '',
        gender: m.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
        faculty: m.faculty || 'Fakultas Teknik',
        major: m.major || '-',
        entry_year: m.entryYear || 2020,
        entryYear: m.entryYear || 2020,
        phone_number: m.phone || '',
        phone: m.phone || '',
        email: m.email || '',
        city: m.city || 'Medan',
        profession: m.profession || '-',
        company: m.company || '',
        ktb_group: m.ktb || '',
      }));

      await api.members.bulkCommit(validRows);
      processedCount += chunk.length;

      if (onProgress) {
        onProgress({
          currentBatch: b + 1,
          totalBatches,
          processed: processedCount,
          total,
          percent: Math.round((processedCount / total) * 100),
        });
      }
    }

    await refreshFromApi();
    return { success: true, count: processedCount };
  };

  const addBulkMembers = (newMembersData: Omit<Member, 'id' | 'nia'>[]): number => {
    addBulkMembersChunked(newMembersData).catch((err) =>
      console.error('Failed to commit bulk members chunked:', err)
    );
    return newMembersData.length;
  };

  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    try {
      await api.members.update(id, {
        fullName: updates.name,
        nik: updates.nik,
        gender: updates.gender === 'Perempuan' ? 'F' : updates.gender === 'Laki-laki' ? 'M' : updates.gender,
        birthPlace: updates.birthPlace,
        birthDate: updates.birthDate,
        bloodType: updates.bloodType,
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
    } finally {
      await refreshFromApi();
    }
  };

  const deleteMember = async (id: string): Promise<void> => {
    try {
      await api.members.delete(id);
    } finally {
      // Selalu panggil get/refresh dari server DB baik sukses maupun gagal
      // agar data di UI selalu real dari database.
      await refreshFromApi();
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
      gender: regData.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      birthPlace: regData.birthPlace,
      birthDate: regData.birthDate,
      bloodType: regData.bloodType,
      homeAddress: regData.address,
      city: regData.city,
      province: regData.province || 'Sumatera Utara',
      postalCode: regData.postalCode,
      faculty: regData.faculty,
      major: regData.major,
      entryYear: regData.entryYear,
      graduationYear: regData.graduationYear || regData.gradYear,
      gradYear: regData.graduationYear || regData.gradYear,
      profession: regData.profession,
      currentProfession: regData.profession,
      company: regData.company,
      ktb: regData.ktb,
      ministryInterest: regData.ministryInterest,
      maritalStatus: regData.maritalStatus,
      weddingDate: regData.weddingDate,
      partnerName: regData.partnerName,
      childrenCount: regData.childrenCount,
      memberType: regData.memberType || 'ALUMNI',
      socialMedia: regData.socialMedia,
    }).then((res) => {
      if (res?.registration) {
        setRegistrations((prev) =>
          prev.map((r) => r.ticket === ticket ? { ...r, id: res.registration.id, ticket: res.registration.ticketNumber } : r)
        );
      }
    }).catch((err) => console.error('Failed to submit registration to API:', err));

    return ticket;
  };

  const approveRegistration = async (regId: string): Promise<Member | null> => {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return null;

    try {
      const res = await api.registrations.approve(regId);
      const officialNia = res?.member?.nia || res?.member?.memberNumber || res?.memberNumber || generateNextNia();
      const officialId = res?.member?.id || `m-${Date.now()}`;

      return {
        id: officialId,
        nia: officialNia,
        name: reg.name,
        nik: reg.nik,
        gender: reg.gender,
        birthPlace: reg.birthPlace,
        birthDate: reg.birthDate,
        bloodType: reg.bloodType,
        faculty: reg.faculty,
        major: reg.major,
        entryYear: reg.entryYear,
        graduationYear: reg.graduationYear || reg.gradYear,
        address: reg.address,
        city: reg.city,
        province: reg.province || 'Sumatera Utara',
        postalCode: reg.postalCode,
        phone: reg.wa,
        email: reg.email,
        profession: reg.profession || 'Alumni Profesional',
        company: reg.company || '-',
        ktb: reg.ktb || '-',
        ministryInterest: reg.ministryInterest,
        maritalStatus: reg.maritalStatus || 'Lajang',
        weddingDate: reg.weddingDate,
        partnerName: reg.partnerName,
        childrenCount: reg.childrenCount,
        socialMedia: reg.socialMedia || {},
        status: 'ACTIVE',
        type: reg.memberType || 'ALUMNI',
        createdAt: new Date().toISOString().split('T')[0],
      };
    } finally {
      await refreshFromApi();
    }
  };

  const rejectRegistration = async (regId: string, reason?: string): Promise<void> => {
    try {
      await api.registrations.reject(regId, reason || 'Data tidak memenuhi syarat verifikasi');
    } finally {
      await refreshFromApi();
    }
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
        addBulkMembersChunked,
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

