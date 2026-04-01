import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api, { authStorage } from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://3.236.242.186.nip.io/api';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'nissaet_auth_user';

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  const role = String(rawUser.role || rawUser.user_type || 'student').toLowerCase();
  return { ...rawUser, role, user_type: role };
};

const getStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('user');
  if (!raw) return null;

  try {
    return normalizeUser(JSON.parse(raw));
  } catch (error) {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('user');
    return null;
  }
};

const storeSession = (token, user) => {
  const normalizedUser = normalizeUser(user);
  authStorage.setToken(token);
  localStorage.setItem('token', token); // backward compatibility for existing code
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  localStorage.setItem('user', JSON.stringify(normalizedUser));
  return normalizedUser;
};

const persistUser = (user) => {
  const normalizedUser = normalizeUser(user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  localStorage.setItem('user', JSON.stringify(normalizedUser));
  return normalizedUser;
};

const clearSession = () => {
  authStorage.clearToken();
  localStorage.removeItem('token');
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('user');
};

const resolveAuthToken = (data) => (
  data?.token ||
  data?.access_token ||
  data?.data?.token ||
  data?.data?.access_token ||
  null
);

const resolveAuthUser = (data) => (
  data?.user ||
  data?.data?.user ||
  data?.data ||
  null
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserFromApi = async () => {
    try {
      const data = await api.getCurrentUser();
      const normalized = persistUser(data.user || data);
      setUser(normalized);
      return normalized;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = authStorage.getToken() || localStorage.getItem('token');
      if (!token) {
        clearSession();
        setLoading(false);
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        if (storedUser.role === 'company' && !storedUser.company_profile) {
          await syncUserFromApi();
        }
        setLoading(false);
        return;
      }

      try {
        const data = await api.getCurrentUser();
        const normalizedUser = storeSession(token, data.user || data);
        setUser(normalizedUser);
      } catch (error) {
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    const token = resolveAuthToken(data);
    const user = resolveAuthUser(data);
    if (!token) {
      throw new Error('Login response did not include an auth token.');
    }
    const normalizedUser = storeSession(token, user);
    setUser(normalizedUser);
    await syncUserFromApi();
    return { user: normalizedUser, token };
  };

  const loginWithToken = async (token) => {
    authStorage.setToken(token);
    localStorage.setItem('token', token);
    const data = await api.getCurrentUser();
    const normalizedUser = storeSession(token, data.user || data);
    setUser(normalizedUser);
    return { user: normalizedUser, token };
  };

  const register = async (userData, navigate) => {
    console.log('Starting registration with data:', userData);
    try {
      const data = await api.register(userData);
      console.log('Registration response:', data);
      
      const token = resolveAuthToken(data);
      const user = resolveAuthUser(data);
      if (!token) {
        throw new Error('Registration response did not include an auth token.');
      }
      const normalizedUser = storeSession(token, user);
      setUser(normalizedUser);
      await syncUserFromApi();
      
      if (typeof navigate === 'function') {
        navigate('/login');
      }
      
      return { user: normalizedUser, token };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const socialLogin = async (provider, payload) => {
    const data = await api.socialLogin({ provider, ...payload });
    const token = resolveAuthToken(data);
    const user = resolveAuthUser(data);
    if (!token) {
      throw new Error('Social login response did not include an auth token.');
    }
    const normalizedUser = storeSession(token, user);
    setUser(normalizedUser);
    await syncUserFromApi();
    return { user: normalizedUser, token };
  };

  const loginWithGoogle = async (payload) => socialLogin('google', payload);
  const loginWithGithub = async (payload) => socialLogin('github', payload);

  const updateUser = (updates) => {
    setUser((previousUser) => {
      if (!previousUser) return previousUser;
      const nextUser = persistUser({ ...previousUser, ...updates });
      return nextUser;
    });
  };

  const forgotPassword = async (email) => {
    return api.forgotPassword({ email });
  };

  const resetPassword = async (token, newPassword) => {
    return api.resetPassword({ token, newPassword });
  };

  const logout = (navigate) => {
    clearSession();
    setUser(null);
    if (typeof navigate === 'function') {
      navigate('/login');
    }
  };

  useEffect(() => {
    // FIX MARK: keep auth session user in sync when profile settings (including image) are updated.
    const handleProfileUpdated = (event) => {
      const personal = event?.detail?.personal;
      if (!personal) return;

      updateUser({
        full_name: personal.full_name,
        name: personal.full_name,
        profile_image: personal.profile_image,
      });
    };

    const handleAccountSuspended = (event) => {
      const status = event?.detail?.status || 'suspended';
      updateUser({ status });
    };

    window.addEventListener('profile-settings-updated', handleProfileUpdated);
    window.addEventListener('app:account-suspended', handleAccountSuspended);
    return () => {
      window.removeEventListener('profile-settings-updated', handleProfileUpdated);
      window.removeEventListener('app:account-suspended', handleAccountSuspended);
    };
  }, []);

  const isAuthenticated = !!user && !!(authStorage.getToken() || localStorage.getItem('token'));

  useEffect(() => {
    if (!isAuthenticated) return;

    const refresh = () => syncUserFromApi();
    const intervalId = window.setInterval(refresh, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    const handleRouteChange = () => {
      refresh();
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('app:route-change', handleRouteChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('app:route-change', handleRouteChange);
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      user,
      login,
      loginWithToken,
      register,
      loginWithGoogle,
      loginWithGithub,
      forgotPassword,
      resetPassword,
      logout,
      updateUser,
      isAuthenticated,
      hasRole: (role) => user?.role === role,
      loading,
    }),
    [user, loading, isAuthenticated]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

