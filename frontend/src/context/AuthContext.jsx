import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

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

  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    const role = rawUser.role || rawUser.user_type || null;
    return { ...rawUser, role, user_type: role };
  };

  const redirectByRole = (role, navigate) => {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'company':
        navigate('/company/dashboard');
        break;
      case 'student':
        navigate('/student/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = normalizeUser(JSON.parse(userData));
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, navigate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const normalizedUser = normalizeUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      redirectByRole(normalizedUser?.role, navigate);

      return { success: true, user: normalizedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
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

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const normalizedUser = normalizeUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      // Clear registration data from localStorage
      localStorage.removeItem('registrationStep1');
      localStorage.removeItem('registrationStep2');
      localStorage.removeItem('registrationRole');

      redirectByRole(normalizedUser?.role, navigate);

      return { success: true, user: normalizedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = (navigate) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        hasRole,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};