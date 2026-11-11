import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, UpdateProfileDTO } from '@anisume/shared';
import { authApi } from '../api/authClient.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (dto: UpdateProfileDTO) => Promise<User>;
  resendVerification: (email?: string) => Promise<string>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount from HTTP-only cookie
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const refreshUser = async (): Promise<User | null> => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error('[AuthContext] Failed to restore session:', err);
      setUser(null);
      return null;
    }
  };

  const login = async (identifier: string, password: string): Promise<User> => {
    const res = await authApi.login({ identifier, password });
    setUser(res.user);
    return res.user;
  };

  const register = async (username: string, email: string, password: string): Promise<User> => {
    const res = await authApi.register({ username, email, password });
    setUser(res.user);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (dto: UpdateProfileDTO): Promise<User> => {
    const res = await authApi.updateProfile(dto);
    setUser(res.user);
    return res.user;
  };

  const resendVerification = async (email?: string): Promise<string> => {
    const res = await authApi.resendVerification(email || user?.email);
    return res.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        resendVerification,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

