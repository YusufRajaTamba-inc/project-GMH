import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CurrentUser, UserRole } from './auth';
import { ROLE_LABELS } from './auth';
import { api } from '../services/api';

interface AuthContextValue {
  user: CurrentUser;
  token: string | null;
  isLoading: boolean;
  setRole: (role: UserRole) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const DEFAULT_USER: CurrentUser = {
  id: '1',
  name: 'Yusuf Siregar',
  role: 'SUPER_ADMIN',
  department: 'Sekretariat Yayasan',
  initials: 'YS',
};

const AuthContext = createContext<AuthContextValue>({
  user: DEFAULT_USER,
  token: null,
  isLoading: false,
  setRole: async () => {},
  login: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gmh_auth_token'));
  const [isLoading, setIsLoading] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('gmh_auth_token');
      if (savedToken) {
        try {
          const res = await api.auth.getMe();
          if (res?.user) {
            setUser({
              id: res.user.id,
              name: res.user.full_name || res.user.username,
              role: res.user.role_id,
              department: res.user.role_name || ROLE_LABELS[res.user.role_id] || 'Yayasan GMH',
              initials: (res.user.full_name || res.user.username || 'YS')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2),
            });
            setToken(savedToken);
            return;
          }
        } catch {
          // Token expired or invalid, fallback to demo switch
        }
      }

      // Default demo login as SUPER_ADMIN
      try {
        const switchRes = await api.auth.demoSwitch('SUPER_ADMIN');
        if (switchRes.token) {
          setToken(switchRes.token);
          setUser({
            id: switchRes.user.id,
            name: switchRes.user.fullName,
            role: switchRes.user.roleId,
            department: switchRes.user.roleName || 'Super Administrator',
            initials: 'SA',
          });
        }
      } catch (err) {
        console.warn('Backend API connection offline, running in offline demo mode:', err);
      }
    };

    initAuth();
  }, []);

  const setRole = async (role: UserRole) => {
    setIsLoading(true);
    // Role display names
    const names: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrator',
      DEWAN_PENGAWAS_PEMBINA: 'Bpk. Dewan Pengawas & Pembina',
      DEWAN_PENGAWAS: 'Bpk. Dewan Pengawas',
      PENGURUS_HARIAN: 'Pengurus Harian Yayasan',
      BENDAHARA_YAYASAN: 'Ibu Bendahara Yayasan (Pusat & Gaji)',
      BENDAHARA_ADMIN: 'Admin Kas Operasional',
      KOORDINATOR_DEPARTEMEN: 'Koordinator Departemen Misi',
      ADMIN_OPERASIONAL: 'Admin Operasional',
      ANGGOTA_ALUMNI: 'Alumni PA KMK',
      ALUMNI_ANGGOTA: 'Alumni PA KMK',
    };

    const initials: Record<string, string> = {
      SUPER_ADMIN: 'SA',
      DEWAN_PENGAWAS_PEMBINA: 'DP',
      DEWAN_PENGAWAS: 'DP',
      PENGURUS_HARIAN: 'PH',
      BENDAHARA_YAYASAN: 'BY',
      BENDAHARA_ADMIN: 'BA',
      KOORDINATOR_DEPARTEMEN: 'KD',
      ADMIN_OPERASIONAL: 'AO',
      ANGGOTA_ALUMNI: 'AL',
      ALUMNI_ANGGOTA: 'AL',
    };

    // Normalize role ID for backend
    const normalizedRole = role === 'DEWAN_PENGAWAS' ? 'DEWAN_PENGAWAS_PEMBINA'
      : role === 'ADMIN_OPERASIONAL' ? 'KOORDINATOR_DEPARTEMEN'
      : role === 'ALUMNI_ANGGOTA' ? 'ANGGOTA_ALUMNI'
      : role;

    try {
      const res = await api.auth.demoSwitch(normalizedRole);
      if (res.token) {
        setToken(res.token);
        setUser({
          id: res.user.id,
          name: res.user.fullName || names[role] || 'User Yayasan',
          role: role,
          initials: initials[role] || 'GM',
          department: ROLE_LABELS[normalizedRole] || ROLE_LABELS[role] || 'Yayasan GMH',
        });
      }
    } catch {
      // Fallback local update
      setUser({
        id: '1',
        name: names[role] || 'User Yayasan',
        role,
        initials: initials[role] || 'GM',
        department: ROLE_LABELS[role] || 'Yayasan GMH',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(username, password);
      if (res.success && res.token) {
        setToken(res.token);
        setUser({
          id: res.user.id,
          name: res.user.fullName,
          role: res.user.roleId,
          department: res.user.roleName || ROLE_LABELS[res.user.roleId],
          initials: res.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setToken(null);
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

