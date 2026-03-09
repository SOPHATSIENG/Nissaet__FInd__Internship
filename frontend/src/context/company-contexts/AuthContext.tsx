import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useBackendAuth } from '../AuthContext';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useBackendAuth();

  const value = useMemo(() => {
    const backendUser = backend?.user || null;
    return {
      user: backendUser,
      profile: backendUser?.company_profile || null,
      loading: backend?.loading ?? false,
      signIn: async () => {
        throw new Error('Company signIn is not available in DB mode. Use /login.');
      },
      logout: async () => {
        backend?.logout?.();
      },
      updateUser: (updates: any) => {
        backend?.updateUser?.(updates);
      },
    };
  }, [backend]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
