// ============================================================================
// API CLIENT SERVICE — Yayasan Global Mission House (GMH PA KMK)
// P1-A: Semua request menggunakan credentials:'include' untuk HttpOnly Cookie
// ============================================================================

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'include', // P1-A: Kirim & terima HttpOnly Cookie secara otomatis
    ...options,
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}: Terjadi kesalahan.`);
  }

  return data;
}



export interface SignedPermissionsPayload {
  roleId: string;
  allowedModules: string[];
  allowedMenus: string[];
  timestamp: number;
  signature: string;
  integrityHash: string;
}

export interface SystemModuleInfo {
  key: string;
  label: string;
  path: string;
  category: string;
  description: string;
}

export interface RolePermissionMatrixItem {
  role_id: string;
  module_key: string;
  can_access: boolean;
}

export interface PermissionsMatrixResponse {
  success: boolean;
  roles: Array<{ id: string; name: string; description: string }>;
  modules: SystemModuleInfo[];
  permissions: RolePermissionMatrixItem[];
}

export const api = {
  // 1. Auth & RBAC
  auth: {
    login: async (username: string, password: string) => {
      // P1-A: Token tidak ada di body response, disimpan otomatis via HttpOnly Cookie
      const res = await request<{ success: boolean; user: any; permissions?: SignedPermissionsPayload }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      return res;
    },
    demoSwitch: async (roleId: string) => {
      // demo-switch mengembalikan token di body untuk mode offline fallback
      const res = await request<{ success: boolean; token: string; user: any }>('/auth/demo-switch', {
        method: 'POST',
        body: JSON.stringify({ roleId }),
      });
      return res;
    },
    getMe: () => request<{ success: boolean; user: any; permissions?: SignedPermissionsPayload }>('/auth/me'),
    getRoles: () => request('/auth/roles'),
    changePassword: (data: { currentPassword?: string; newPassword: string; confirmPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    logout: async () => {
      // P1-A: Hapus cookie di sisi server
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {
        // Abaikan error, tetap lanjutkan logout di sisi client
      }
    },
  },

  // 2. Members & Alumni (PA KMK)
  members: {
    getAll: (params?: { search?: string; faculty?: string; type?: string; status?: string; limit?: string | number }) => {
      const finalParams = { limit: 'all', ...(params || {}) };
      const query = new URLSearchParams(finalParams as any).toString();
      return request(`/members?${query}`);
    },
    getById: (id: string) => request(`/members/${id}`),
    create: (data: any) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/members/${id}`, { method: 'DELETE' }),
    bulkDryRun: (rows: any[]) =>
      request('/members/bulk-dry-run', { method: 'POST', body: JSON.stringify({ rows }) }),
    bulkCommit: (validRows: any[]) =>
      request('/members/bulk-commit', { method: 'POST', body: JSON.stringify({ validRows }) }),
  },

  // 3. Registrations (Flow 1)
  registrations: {
    publicRegister: (data: any) =>
      request('/registrations/public/register-alumni', { method: 'POST', body: JSON.stringify(data) }),
    getAll: (status?: string) =>
      request(`/registrations${status ? `?status=${status}` : ''}`),
    approve: (id: string) =>
      request(`/registrations/${id}/approve`, { method: 'POST' }),
    reject: (id: string, reason: string) =>
      request(`/registrations/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },

  // 4. Finance & Donations (Flow 3)
  finance: {
    getTransactions: (params?: { scope?: string; type?: string; accountId?: string; limit?: string | number }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/finance/transactions${query ? `?${query}` : ''}`);
    },
    createTransaction: (data: any) =>
      request('/finance/transactions', { method: 'POST', body: JSON.stringify(data) }),
    batchCreateTransactions: (rows: any[]) =>
      request('/finance/transactions/batch', { method: 'POST', body: JSON.stringify({ rows }) }),
    updateTransaction: (id: string, data: any) =>
      request(`/finance/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTransaction: (id: string) =>
      request(`/finance/transactions/${id}`, { method: 'DELETE' }),
    getAuditLogs: () =>
      request('/finance/audit-logs'),
    getAccounts: () => request('/finance/accounts'),
    getDonations: () => request('/finance/donations'),
    getPledgeDetail: (id: string) => request(`/finance/donations/${id}`),
    createPledge: (data: any) => request('/finance/donations', { method: 'POST', body: JSON.stringify(data) }),
    addInstallment: (id: string, data: any) =>
      request(`/finance/donations/${id}/installments`, { method: 'POST', body: JSON.stringify(data) }),
    getMemberDonations: (memberId: string) => request(`/finance/members/${memberId}/donations`),
    recordPayment: (data: any) =>
      request('/finance/donations/payment', { method: 'POST', body: JSON.stringify(data) }),
    verifyReceipt: (receiptNumber: string) =>
      request(`/finance/e-receipt/verify/${receiptNumber}`),
  },

  // 5. Payroll (Flow 4 - Isolated)
  payroll: {
    getStaff: () => request('/payroll/staff'),
    getRecords: (periodId: string) => request(`/payroll/records/${periodId}`),
    generateDraft: (periodId: string) =>
      request('/payroll/generate-draft', { method: 'POST', body: JSON.stringify({ periodId }) }),
    disburse: (periodId: string) =>
      request('/payroll/disburse', { method: 'POST', body: JSON.stringify({ periodId }) }),
  },

  // 6. Utility (Flow 5 - Grouped by 8 System Menus)
  utility: {
    getSystemMenus: () => request<{ success: boolean; data: any[]; menus: any[] }>('/utility/system-menus'),
    getLookups: (systemMenu?: string) => {
      const query = systemMenu ? `?systemMenu=${encodeURIComponent(systemMenu)}` : '';
      return request<{
        success: boolean;
        lookups: any[];
        data: any[];
        byCategory: Record<string, any[]>;
        byMenu: Record<string, any[]>;
        grouped?: Record<string, any[]>;
      }>(`/utility/lookups${query}`);
    },
    addLookup: (data: { category: string; code: string; label: string; systemMenu?: string; sortOrder?: number }) =>
      request('/utility/lookups', { method: 'POST', body: JSON.stringify(data) }),
    deleteLookup: (id: string) =>
      request(`/utility/lookups/${id}`, { method: 'DELETE' }),
    getFormConfigs: (module?: string, systemMenu?: string) => {
      const params = new URLSearchParams();
      if (module) params.append('module', module);
      if (systemMenu) params.append('systemMenu', systemMenu);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; configs: any[]; data: any[]; byMenu: Record<string, any[]>; labelMap: Record<string, string> }>(`/utility/form-configs${query}`);
    },
    updateFieldLabel: (data: { fieldKey: string; fieldLabel: string; featureModule?: string; isRequired?: boolean }) =>
      request('/utility/fields/config', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // 7. Dashboard, Building, Programs, Prayer, Assets
  dashboard: {
    getSummary: () => request('/dashboard/summary'),
  },
  reports: {
    getConsolidated: (year: number) => request(`/reports/consolidated?year=${year}`),
  },
  building: {
    getProject: () => request('/building/project'),
    getProjects: (params?: { category?: string; status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/building/projects${query ? `?${query}` : ''}`);
    },
    createProject: (data: any) =>
      request('/building/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id: string, data: any) =>
      request(`/building/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id: string) =>
      request(`/building/projects/${id}`, { method: 'DELETE' }),
  },
  missions: {
    getAll: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/missions${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request(`/missions/${id}`),
    create: (data: any) => request('/missions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/missions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    addTransaction: (id: string, data: any) =>
      request(`/missions/${id}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
    deleteTransaction: (id: string, trxId: string) =>
      request(`/missions/${id}/transactions/${trxId}`, { method: 'DELETE' }),
    updateRundown: (id: string, rundown: any[]) =>
      request(`/missions/${id}/rundown`, { method: 'PUT', body: JSON.stringify({ rundown }) }),
    updateTasks: (id: string, tasks: any[]) =>
      request(`/missions/${id}/tasks`, { method: 'PUT', body: JSON.stringify({ tasks }) }),
    updateCommittees: (id: string, committees: any[]) =>
      request(`/missions/${id}/committees`, { method: 'PUT', body: JSON.stringify({ committees }) }),
    updateStatus: (id: string, status: string) =>
      request(`/missions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/missions/${id}`, { method: 'DELETE' }),
  },
  programs: {
    getAll: (params?: { category?: string; status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/programs${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request(`/programs/${id}`),
    create: (data: any) => request('/programs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    addTransaction: (id: string, data: any) =>
      request(`/programs/${id}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
    deleteTransaction: (id: string, trxId: string) =>
      request(`/programs/${id}/transactions/${trxId}`, { method: 'DELETE' }),
    updateRundown: (id: string, rundown: any[]) =>
      request(`/programs/${id}/rundown`, { method: 'PUT', body: JSON.stringify({ rundown }) }),
    updateTasks: (id: string, tasks: any[]) =>
      request(`/programs/${id}/tasks`, { method: 'PUT', body: JSON.stringify({ tasks }) }),
    updateCommittees: (id: string, committees: any[]) =>
      request(`/programs/${id}/committees`, { method: 'PUT', body: JSON.stringify({ committees }) }),
    updateStatus: (id: string, status: string) =>
      request(`/programs/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/programs/${id}`, { method: 'DELETE' }),
  },
  prayer: {
    getAll: () => request('/prayer'),
    updateStatus: (id: string, data: { status: string; counselorNotes?: string }) =>
      request(`/prayer/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    publicSubmit: (data: any) =>
      request('/prayer/public/submit', { method: 'POST', body: JSON.stringify(data) }),
  },
  assets: {
    getAll: (params?: { search?: string; condition?: string; type?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/assets${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request(`/assets/${id}`),
    create: (data: any) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/assets/${id}`, { method: 'DELETE' }),
    getLoans: (params?: { status?: string; loanType?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/assets/loans${query ? `?${query}` : ''}`);
    },
    createLoan: (data: any) => request('/assets/loans', { method: 'POST', body: JSON.stringify(data) }),
    returnLoan: (id: string, data: { actualReturnAt?: string; conditionOnReturn?: string; notes?: string }) =>
      request(`/assets/loans/${id}/return`, { method: 'PUT', body: JSON.stringify(data) }),
    getAvailable: () => request('/assets/public/available'),
    publicRequest: (data: any) => request('/assets/public/request', { method: 'POST', body: JSON.stringify(data) }),
    trackRequest: (query: string) => request(`/assets/public/track/${encodeURIComponent(query)}`),
    approveLoan: (id: string, data?: { approvalNotes?: string }) =>
      request(`/assets/loans/${id}/approve`, { method: 'PUT', body: JSON.stringify(data || {}) }),
    rejectLoan: (id: string, data: { rejectionReason: string }) =>
      request(`/assets/loans/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),
    handoverLoan: (id: string) => request(`/assets/loans/${id}/handover`, { method: 'PUT' }),
  },
  users: {
    getAll: (params?: { search?: string; roleId?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request(`/users${query ? `?${query}` : ''}`);
    },
    getRoles: () => request('/users/roles'),
    getPermissionsMatrix: () => request<PermissionsMatrixResponse>('/users/permissions'),
    updateRolePermissions: (roleId: string, permissions: Record<string, boolean>) =>
      request<{ success: boolean; message: string; roleId: string; permissions: SignedPermissionsPayload }>(
        '/users/permissions',
        {
          method: 'PUT',
          body: JSON.stringify({ roleId, permissions }),
        }
      ),
    getById: (id: string) => request(`/users/${id}`),
    create: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleStatus: (id: string) => request(`/users/${id}/toggle-status`, { method: 'PATCH' }),
    delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  },
  organization: {
    getStats: () => request<{ success: boolean; stats: any }>('/organization/stats'),
    lookupMembers: (search?: string) =>
      request<{ success: boolean; members: any[] }>(`/organization/lookup-members${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    
    // Tab 1: Committees
    getCommittees: (params?: { search?: string; year?: number | string; status?: string; member_id?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ success: boolean; count: number; committees: any[] }>(`/organization/committees${query ? `?${query}` : ''}`);
    },
    createCommittee: (data: any) => request('/organization/committees', { method: 'POST', body: JSON.stringify(data) }),
    updateCommittee: (id: string, data: any) => request(`/organization/committees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCommittee: (id: string) => request(`/organization/committees/${id}`, { method: 'DELETE' }),

    // Tab 2: Core positions & Tenures
    getPositions: () => request<{ success: boolean; count: number; positions: any[] }>('/organization/positions'),
    createPosition: (data: any) => request('/organization/positions', { method: 'POST', body: JSON.stringify(data) }),
    updatePosition: (id: string, data: any) => request(`/organization/positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePosition: (id: string) => request(`/organization/positions/${id}`, { method: 'DELETE' }),
    getPositionTenures: (positionId: string) =>
      request<{ success: boolean; count: number; tenures: any[] }>(`/organization/positions/${positionId}/tenures`),
    addTenure: (positionId: string, data: any) =>
      request(`/organization/positions/${positionId}/tenures`, { method: 'POST', body: JSON.stringify(data) }),
    updateTenure: (tenureId: string, data: any) =>
      request(`/organization/tenures/${tenureId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTenure: (tenureId: string) =>
      request(`/organization/tenures/${tenureId}`, { method: 'DELETE' }),

    // Tab 3: Full-time Staff
    getStaff: (params?: { search?: string; department_id?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ success: boolean; count: number; staff: any[] }>(`/organization/staff${query ? `?${query}` : ''}`);
    },
    createStaff: (data: any) => request('/organization/staff', { method: 'POST', body: JSON.stringify(data) }),
    updateStaff: (id: string, data: any) => request(`/organization/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteStaff: (id: string) => request(`/organization/staff/${id}`, { method: 'DELETE' }),

    // Tab 4: Divisions & Members
    getDivisions: () => request<{ success: boolean; count: number; divisions: any[] }>('/organization/divisions'),
    createDivision: (data: any) => request('/organization/divisions', { method: 'POST', body: JSON.stringify(data) }),
    updateDivision: (id: string, data: any) => request(`/organization/divisions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDivision: (id: string) => request(`/organization/divisions/${id}`, { method: 'DELETE' }),
    getDivisionMembers: (divisionId: string, status?: string) =>
      request<{ success: boolean; count: number; members: any[] }>(`/organization/divisions/${divisionId}/members${status ? `?status=${status}` : ''}`),
    addDivisionMember: (divisionId: string, data: any) =>
      request(`/organization/divisions/${divisionId}/members`, { method: 'POST', body: JSON.stringify(data) }),
    updateDivisionMember: (assignmentId: string, data: any) =>
      request(`/organization/division-members/${assignmentId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDivisionMember: (assignmentId: string) =>
      request(`/organization/division-members/${assignmentId}`, { method: 'DELETE' }),
  },
  notifications: {
    getAll: () =>
      request<{
        success: boolean;
        totalCount: number;
        counts: { total: number; programs: number; registrations: number; loans: number };
        notifications: Array<{
          id: string;
          rawId: string;
          type: 'PROGRAM' | 'REGISTRATION' | 'ASSET_LOAN';
          title: string;
          category?: string;
          description: string;
          date?: string;
          daysLeft?: number;
          badgeText: string;
          badgeType: 'urgent' | 'warning' | 'info';
          targetUrl: string;
          createdAt: string;
        }>;
        groups: {
          programs: any[];
          registrations: any[];
          loans: any[];
        };
      }>('/notifications'),
  },
  secretariat: {
    getStats: () => request<{
      success: boolean;
      data: {
        outgoing: { total: number; thisYear: number; drafts: number };
        incoming: { total: number; thisYear: number; pendingDisposition: number };
      };
    }>('/secretariat/stats'),
    getNumberingConfig: () => request<{
      success: boolean;
      config: {
        pattern: string;
        prefix: string;
        padding: number;
        counter: number;
        resetPeriod: string;
      };
      preview: string;
      categories: Array<{ id: string; code: string; label: string; sort_order: number }>;
    }>('/secretariat/numbering-config'),
    updateNumberingConfig: (data: {
      pattern?: string;
      prefix?: string;
      padding?: number;
      counter?: number;
      resetPeriod?: string;
    }) => request<{ success: boolean; message: string; config: any; preview: string }>('/secretariat/numbering-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getNextNumber: (category?: string, date?: string) => {
      const q = new URLSearchParams();
      if (category) q.set('category', category);
      if (date) q.set('date', date);
      return request<{
        success: boolean;
        nextNumber: string;
        counter: number;
        pattern: string;
        prefix: string;
      }>(`/secretariat/outgoing/next-number${q.toString() ? `?${q.toString()}` : ''}`);
    },
    // Surat Keluar
    getOutgoing: (params?: { search?: string; category?: string; status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.category) q.set('category', params.category);
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request<{ success: boolean; letters: any[]; meta: any }>(`/secretariat/outgoing?${q.toString()}`);
    },
    getOutgoingById: (id: string) => request<{ success: boolean; letter: any }>(`/secretariat/outgoing/${id}`),
    createOutgoing: (data: any) => request<{ success: boolean; message: string; letter: any }>('/secretariat/outgoing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateOutgoing: (id: string, data: any) => request<{ success: boolean; message: string; letter: any }>(`/secretariat/outgoing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteOutgoing: (id: string) => request<{ success: boolean; message: string }>(`/secretariat/outgoing/${id}`, {
      method: 'DELETE',
    }),

    // Surat Masuk
    getIncoming: (params?: { search?: string; status?: string; disposition_to?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      if (params?.disposition_to) q.set('disposition_to', params.disposition_to);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return request<{ success: boolean; letters: any[]; meta: any }>(`/secretariat/incoming?${q.toString()}`);
    },
    getIncomingById: (id: string) => request<{ success: boolean; letter: any }>(`/secretariat/incoming/${id}`),
    createIncoming: (data: any) => request<{ success: boolean; message: string; letter: any }>('/secretariat/incoming', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateIncoming: (id: string, data: any) => request<{ success: boolean; message: string; letter: any }>(`/secretariat/incoming/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteIncoming: (id: string) => request<{ success: boolean; message: string }>(`/secretariat/incoming/${id}`, {
      method: 'DELETE',
    }),
  },
};

export default api;
