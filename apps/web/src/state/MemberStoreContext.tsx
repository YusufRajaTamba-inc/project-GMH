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
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  submitPublicRegistration: (reg: Omit<Registration, 'id' | 'ticket' | 'submittedAt' | 'status'>) => string;
  approveRegistration: (regId: string) => Member | null;
  rejectRegistration: (regId: string, reason?: string) => void;
}

const MemberStoreContext = createContext<MemberStoreContextValue>({
  members: [],
  registrations: [],
  isLoading: false,
  refreshFromApi: async () => {},
  addMember: () => ({} as Member),
  addBulkMembers: () => 0,
  addBulkMembersChunked: async () => ({ success: true, count: 0 }),
  updateMember: () => {},
  deleteMember: () => {},
  submitPublicRegistration: () => '',
  approveRegistration: () => null,
  rejectRegistration: () => {},
});

const STORAGE_KEY = 'gmh_member_store_v2';

export const MemberStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
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
    if (memberData.nik && memberData.nik.trim()) {
      const cleanNik = memberData.nik.trim();
      const existing = members.find((m) => m.nik && m.nik.trim() === cleanNik);
      if (existing) {
        throw new Error(
          `NIK ${cleanNik} sudah terdaftar atas nama ${existing.name} (${existing.nia}). Data anggota dengan NIK yang sama tidak dapat ditambahkan.`
        );
      }
    }

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

