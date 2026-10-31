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



export const api = {
  // 1. Auth & RBAC
  auth: {
    login: async (username: string, password: string) => {
      // P1-A: Token tidak ada di body response, disimpan otomatis via HttpOnly Cookie
      const res = await request<{ success: boolean; user: any }>('/auth/login', {
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
    getMe: () => request('/auth/me'),
    getRoles: () => request('/auth/roles'),
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
    getTransactions: (params?: { scope?: string; type?: string; accountId?: string }) => {
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
    getAll: () => request('/assets'),
    create: (data: any) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  },
};

export default api;
