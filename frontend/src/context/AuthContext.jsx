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

  const register = async (userData, navigate) => {
    console.log('Starting registration with data:', userData);
    try {
      let endpoint = `${API_BASE_URL}/api/auth/register`;
      const role = userData.role || userData.user_type;
      
      console.log('Determined role:', role);
      
      // Use specific endpoints based on user type
      if (role === 'student' && userData.skills) {
        endpoint = `${API_BASE_URL}/api/auth/register/student`;
      } else if (role === 'company' && userData.company_name) {
        endpoint = `${API_BASE_URL}/api/auth/register/company`;
      } else if (role === 'admin' && userData.admin_code) {
        endpoint = `${API_BASE_URL}/api/auth/register/admin`;
      }

      console.log('Using endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Response data:', data);

  const socialLogin = async (provider, payload) => {
    const data = await api.socialLogin({ provider, ...payload });
    const normalizedUser = storeSession(data.token, data.user);
    setUser(normalizedUser);
    return { user: normalizedUser, token: data.token };
  };

  const loginWithGoogle = async (payload) => socialLogin('google', payload);
  const loginWithGithub = async (payload) => socialLogin('github', payload);

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
