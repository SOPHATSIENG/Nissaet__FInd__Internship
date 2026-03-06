import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api, { authStorage } from '../api/axios';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'nissaet_auth_user';

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  const role = rawUser.role || rawUser.user_type || 'student';
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
    const normalizedUser = storeSession(data.token, data.user);
    setUser(normalizedUser);
    return { user: normalizedUser, token: data.token };
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    const normalizedUser = storeSession(data.token, data.user);
    setUser(normalizedUser);

    localStorage.removeItem('registrationStep1');
    localStorage.removeItem('registrationStep2');
    localStorage.removeItem('registrationRole');

    return { user: normalizedUser, token: data.token };
  };

  const socialLogin = async (provider, payload) => {
    const data = await api.socialLogin({ provider, ...payload });
    const normalizedUser = storeSession(data.token, data.user);
    setUser(normalizedUser);
    return { user: normalizedUser, token: data.token };
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

    window.addEventListener('profile-settings-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('profile-settings-updated', handleProfileUpdated);
    };
  }, []);

  const isAuthenticated = !!user && !!(authStorage.getToken() || localStorage.getItem('token'));

  const value = useMemo(
    () => ({
      user,
      login,
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
