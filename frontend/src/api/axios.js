const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const AUTH_STORAGE_KEY = 'nissaet_auth_token';

function getStoredToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

function setStoredToken(token) {
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  }
}

function clearStoredToken() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = false,
    headers = {},
  } = options;

  const requestHeaders = { ...headers };
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(`Cannot connect to backend API at ${API_BASE_URL}. Make sure backend server is running.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    console.error('API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: `${API_BASE_URL}${path}`,
      data: data
    });
    throw new Error(message);
  }

  return data;
}

export const authStorage = {
  getToken: getStoredToken,
  setToken: setStoredToken,
  clearToken: clearStoredToken,
};

export const api = {
  register(payload) {
    const role = payload?.role || payload?.user_type;

    if (role === 'student' && Array.isArray(payload?.skills) && payload.skills.length > 0) {
      return request('/auth/register/student', { method: 'POST', body: payload });
    }
    if (role === 'company' && payload?.company_name) {
      return request('/auth/register/company', { method: 'POST', body: payload });
    }
    if (role === 'admin' && payload?.admin_code) {
      return request('/auth/register/admin', { method: 'POST', body: payload });
    }

    return request('/auth/register', { method: 'POST', body: payload });
  },

  login(payload) {
    return request('/auth/login', { method: 'POST', body: payload });
  },

  socialLogin(payload) {
    return request('/auth/social-login', { method: 'POST', body: payload });
  },

  forgotPassword(payload) {
    return request('/auth/forgot-password', { method: 'POST', body: payload });
  },

  resetPassword(payload) {
    return request('/auth/reset-password', { method: 'POST', body: payload });
  },

  getCurrentUser() {
    return request('/auth/me', { auth: true });
  },

  // FIX MARK: profile settings API used by dynamic account settings page.
  getProfileSettings() {
    return request(`/profile/settings?ts=${Date.now()}`, { auth: true });
  },

  updatePersonalSettings(payload) {
    return request('/profile/personal', { method: 'PUT', auth: true, body: payload });
  },

  updateEducationSettings(payload) {
    return request('/profile/education', { method: 'PUT', auth: true, body: payload });
  },

  updateSkillSettings(payload) {
    return request('/profile/skills', { method: 'PUT', auth: true, body: payload });
  },

  updateNotificationSettings(payload) {
    return request('/profile/notifications', { method: 'PUT', auth: true, body: payload });
  },

  updateCompanySettings(payload) {
    return request('/profile/company', { method: 'PUT', auth: true, body: payload });
  },

  // FIX MARK: notification card API for header bell dropdown.
  getNotificationCard() {
    return request('/profile/notifications/card', { auth: true });
  },

  updatePassword(payload) {
    return request('/profile/security/password', { method: 'PUT', auth: true, body: payload });
  },

  updateTwoFactorSettings(payload) {
    return request('/profile/security/two-factor', { method: 'PUT', auth: true, body: payload });
  },

  getInternshipById(id) {
    return request(`/internships/${id}`).then((data) => {
      return data;
    });
  },

  getCompanies(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/internships/companies${query ? `?${query}` : ''}`).then((data) => {
      if (Array.isArray(data)) {
        return { companies: data };
      }
      return data;
    });
  },

  getInternships(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/internships${query ? `?${query}` : ''}`).then((data) => {
      if (Array.isArray(data)) {
        return { internships: data };
      }
      return data;
    });
  },

  getMatchingInternships() {
    return request('/internships/matching', { auth: true }).then((data) => {
      if (Array.isArray(data)) {
        return { internships: data };
      }
      return data;
    });
  },

  getFeaturedCompanies(limit = 8) {
    return request(`/internships/featured-companies?limit=${limit}`).then((data) => {
      if (Array.isArray(data)) {
        return { companies: data };
      }
      return data;
    });
  },

  getRecommendedInternships() {
    return request('/internships/student/recommended', { auth: true }).then((data) => {
      if (Array.isArray(data)) {
        return { internships: data };
      }
      return data;
    });
  },

  getCompanyInternships() {
    return request('/internships/company/mine', { auth: true });
  },

  createInternship(payload) {
    return request('/internships', { method: 'POST', auth: true, body: payload });
  },

  updateInternship(id, payload) {
    return request(`/internships/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  deleteInternship(id) {
    return request(`/internships/${id}`, { method: 'DELETE', auth: true });
  },

  getCompanyApplications() {
    return request('/applications/company/mine', { auth: true });
  },

  // FIXED: dynamic skill lookup for registration step 3.
  getSkills(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/auth/skills${query ? `?${query}` : ''}`).then((data) => {
      if (Array.isArray(data)) {
        return { skills: data };
      }
      return data;
    });
  },

  createInternship(payload) {
    return request('/internships', { method: 'POST', auth: true, body: payload });
  },

  updateInternship(id, payload) {
    return request(`/internships/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  deleteInternship(id) {
    console.log('Attempting to delete internship with ID:', id);
    console.log('Stored token:', getStoredToken());
    return request(`/internships/${id}`, { method: 'DELETE', auth: true });
  },

  getInternshipById(id) {
    return request(`/internships/${id}`);
  },
};

export default api;
