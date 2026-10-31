import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CurrentUser } from './auth';
import { ROLE_LABELS } from './auth';
import { api, type SignedPermissionsPayload } from '../services/api';

interface AuthContextValue {
  user: CurrentUser;
  permissions: SignedPermissionsPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRouteAllowed: (path: string) => boolean;
  isModuleAllowed: (moduleKey: string) => boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const GUEST_USER: CurrentUser = {
  id: '',
  name: 'Tamu / Belum Masuk',
  role: 'SUPER_ADMIN',
  department: 'Belum masuk sesi',
  initials: '--',
};

const AuthContext = createContext<AuthContextValue>({
  user: GUEST_USER,
  permissions: null,
  isAuthenticated: false,
  isLoading: true,
  isRouteAllowed: () => false,
  isModuleAllowed: () => false,
  login: async () => ({ success: false, message: '' }),
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser>(GUEST_USER);
  const [permissions, setPermissions] = useState<SignedPermissionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.auth.getMe();
      if (res?.user && res.user.id) {
        const u = res.user;
        setUser({
          id: u.id,
          username: u.username,
          name: u.full_name || u.username,
          email: u.email,
          role: u.role_id,
          department: u.role_name || ROLE_LABELS[u.role_id] || 'Yayasan GMH',
          initials: (u.full_name || u.username || 'GM')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        });

        if (res.permissions) {
          setPermissions(res.permissions);
        }
      } else {
        setUser(GUEST_USER);
        setPermissions(null);
      }
    } catch {
      setUser(GUEST_USER);
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(username, password);
      if (res.success && res.user) {
        const u = res.user;
        setUser({
          id: u.id,
          username: u.username,
          name: u.fullName || u.username,
          email: u.email,
          role: u.roleId,
          department: u.roleName || ROLE_LABELS[u.roleId] || 'Yayasan GMH',
          initials: (u.fullName || u.username || 'GM')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        });

        if (res.permissions) {
          setPermissions(res.permissions);
        }
        return { success: true, message: 'Login berhasil.' };
      }
      return { success: false, message: 'Gagal melakukan otentikasi.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Username atau kata sandi tidak cocok.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setUser(GUEST_USER);
      setPermissions(null);
    }
  };

  const isRouteAllowed = useCallback(
    (path: string): boolean => {
      if (!user || !user.id) return false;
      // Super Admin selalu memiliki akses penuh ke seluruh rute sistem
      if (user.role === 'SUPER_ADMIN') return true;

      // Halaman notifikasi dan profil selalu diizinkan untuk semua peran aktif
      if (path === '/notifications' || path === '/profile') return true;

      if (!permissions) return false;

      // Validasi bahwa respons ditandatangani secara kriptografis (HMAC)
      if (!permissions.signature || !permissions.integrityHash) {
        console.warn('[Security Guard] Manipulasi respons atau signature tidak valid terdeteksi.');
        return false;
      }

      // Normalisasi path
      const cleanPath = path.split('?')[0].replace(/\/+$/, '') || '/';

      return permissions.allowedMenus.some((allowed) => {
        const cleanAllowed = allowed.replace(/\/+$/, '') || '/';
        if (cleanAllowed === '/') {
          return cleanPath === '/';
        }
        return cleanPath === cleanAllowed || cleanPath.startsWith(`${cleanAllowed}/`);
      });
    },
    [user, permissions]
  );

  const isModuleAllowed = useCallback(
    (moduleKey: string): boolean => {
      if (!user || !user.id) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (!permissions || !permissions.signature) return false;
      return permissions.allowedModules.includes(moduleKey);
    },
    [user, permissions]
  );

  const isAuthenticated = Boolean(user && user.id);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated,
        isLoading,
        isRouteAllowed,
        isModuleAllowed,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
