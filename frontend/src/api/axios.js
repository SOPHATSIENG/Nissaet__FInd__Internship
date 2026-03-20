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

  const fullUrl = `${API_BASE_URL}${path}`;
  console.log('Full request URL:', fullUrl);

  let response;
  try {
    response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    console.log('Response status:', response.status, response.statusText);
  } catch (error) {
    console.error('Network Error:', error);
    throw new Error(`Cannot connect to backend API at ${API_BASE_URL}. Please ensure the backend server is running and accessible at this address.`);
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearStoredToken();
    if (typeof window !== 'undefined') {
      const path = window.location?.pathname || '';
      const target = path.startsWith('/admin') ? '/admin/login' : '/login';
      if (window.location && window.location.pathname !== target) {
        window.location.assign(target);
      }
    }
  }
  if (response.status === 403) {
    const message = (data?.message || '').toLowerCase();
    if (message.includes('suspended')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:account-suspended', { detail: { status: 'suspended' } }));
        const path = window.location?.pathname || '';
        const target = path.startsWith('/company') ? '/company/suspended' : '/suspended';
        if (window.location && window.location.pathname !== target) {
          window.location.assign(target);
        }
      }
    }
  }
  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    console.error('API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: `${API_BASE_URL}${path}`,
      data: data
    });
    throw new Error(message);
  }

  const methodUpper = String(method || 'GET').toUpperCase();
  if (methodUpper !== 'GET' && methodUpper !== 'HEAD') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:data-refresh'));
    }
  }

  return data;
}

export const authStorage = {
  getToken: getStoredToken,
  setToken: setStoredToken,
  clearToken: clearStoredToken,
};

export const api = {
  // Generic HTTP helpers (axios-like)
  get(path, options = {}) {
    const { auth = true, headers } = options;
    return request(path, { method: 'GET', auth, headers }).then((data) => ({ data }));
  },

  post(path, body, options = {}) {
    const { auth = true, headers } = options;
    return request(path, { method: 'POST', auth, headers, body }).then((data) => ({ data }));
  },

  put(path, body, options = {}) {
    const { auth = true, headers } = options;
    return request(path, { method: 'PUT', auth, headers, body }).then((data) => ({ data }));
  },

  delete(path, options = {}) {
    const { auth = true, headers, body } = options;
    return request(path, { method: 'DELETE', auth, headers, body }).then((data) => ({ data }));
  },

  // Auth endpoints
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

  // Profile settings endpoints
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

  getNotificationCard() {
    return request('/profile/notifications/card', { auth: true });
  },

  markNotificationsRead(payload) {
    return request('/profile/notifications/read', { method: 'PUT', auth: true, body: payload });
  },

  deleteNotification(id) {
    return request(`/profile/notifications/${id}`, { method: 'DELETE', auth: true });
  },

  clearNotifications() {
    return request('/profile/notifications', { method: 'DELETE', auth: true });
  },

  updatePassword(payload) {
    return request('/profile/security/password', { method: 'PUT', auth: true, body: payload });
  },

  updateTwoFactorSettings(payload) {
    return request('/profile/security/two-factor', { method: 'PUT', auth: true, body: payload });
  },

  getStudentProfile(id) {
    return request(`/profile/student/${id}`);
  },

  // Skills endpoint
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

  // Internship endpoints
  getInternshipById(id) {
    return request(`/internships/${id}`).then((data) => {
      return data;
    });
  },

  getCompanyInternshipById(id) {
    return request(`/internships/company/${id}`, { auth: true })
      .then((data) => data)
      .catch(() => request(`/internships/${id}`).then((data) => data));
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
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to fetch internships');
      }
      if (Array.isArray(data)) {
        return { internships: data };
      }
      return data;
    });
  },

  getSavedInternships() {
    return request('/internships/saved', { auth: true }).then((data) => {
      if (Array.isArray(data)) {
        return { internships: data };
      }
      return data;
    });
  },

  saveInternship(internshipId) {
    return request(`/internships/${internshipId}/save`, { method: 'POST', auth: true });
  },

  // Blog & Events endpoints
  getPosts(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/posts${query ? `?${query}` : ''}`, { auth: true });
  },

  getPostById(id) {
    return request(`/posts/${id}`, { auth: true });
  },

  unsaveInternship(internshipId) {
    return request(`/internships/${internshipId}/save`, { method: 'DELETE', auth: true });
  },

  getMyApplications(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/applications/my${query ? `?${query}` : ''}`, { auth: true });
  },

  getMatchingInternships() {
    return request('/internships/matching', { auth: true }).then((data) => {
      if (Array.isArray(data)) {
        return { internships: data };
      }
      return data;
    });
  },

  getFeaturedCompanies(limit = 8, params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    const queryString = query ? `&${query}` : '';
    const url = `/internships/featured-companies?limit=${limit}${queryString}`;
    console.log('Making request to:', `${API_BASE_URL}${url}`);
    return request(url).then((data) => {
      console.log('Response received:', data);
      if (Array.isArray(data)) {
        return { companies: data };
      }
      return data;
    }).catch((error) => {
      console.error('Error in getFeaturedCompanies:', error);
      throw error;
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

  getCompanyArchivedInternships() {
    return request('/internships/company/archived', { auth: true });
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

  restoreInternship(id) {
    return request(`/internships/${id}/restore`, { method: 'PUT', auth: true });
  },

  // Dashboard endpoints
  getDashboardStats() {
    return request('/internships/dashboard/stats', { auth: true });
  },

  getApplicationTrends() {
    return request('/internships/dashboard/trends', { auth: true });
  },

  // Application endpoints
  getCompanyApplications(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/applications/company/mine${query ? `?${query}` : ''}`, { auth: true });
  },
  getMyApplications(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/applications/my${query ? `?${query}` : ''}`, { auth: true });
  },

  // NEW: Get all applications without authentication (for debugging)
  getAllApplications() {
    return request('/applications/all');
  },

  getApplicants() {
    return request('/applications', { auth: true });
  },

  updateApplicationStatus(id, status) {
    return request(`/applications/${id}/status`, { method: 'PUT', auth: true, body: { status } });
  },

  bulkUpdateApplicationStatus(ids, status) {
    return request('/applications/bulk-status', { method: 'PUT', auth: true, body: { ids, status } });
  },

  applyForInternship(internshipId, coverLetter) {
    return request('/applications/apply', { method: 'POST', auth: true, body: { internship_id: internshipId, cover_letter: coverLetter } });
  },
  updateMyApplication(applicationId, coverLetter) {
    return request(`/applications/${applicationId}`, { method: 'PUT', auth: true, body: { cover_letter: coverLetter } });
  },
  deleteMyApplication(applicationId) {
    return request(`/applications/${applicationId}`, { method: 'DELETE', auth: true });
  },
  deleteMyApplicationByInternship(internshipId) {
    return request(`/applications/by-internship/${internshipId}`, { method: 'DELETE', auth: true });
  },

  // Admin methods
  adminGetAllUsers() {
    return request('/admin/users', { auth: true });
  },

  adminGetStats() {
    return request('/admin/stats', { auth: true });
  },

  adminGetDashboardOverview() {
    return request('/admin/dashboard/overview', { auth: true });
  },

  adminGetReports(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();
    return request(`/admin/reports${query ? `?${query}` : ''}`, { auth: true });
  },

  adminGetSettings() {
    return request('/admin/settings', { auth: true });
  },

  adminUpdateSettings(payload) {
    return request('/admin/settings', { method: 'PUT', auth: true, body: payload });
  },

  adminExportData() {
    return request('/admin/settings/export', { method: 'POST', auth: true });
  },

  adminPurgeLogs() {
    return request('/admin/settings/purge', { method: 'POST', auth: true });
  },

  adminGetStudentProfile(id) {
    return request(`/admin/students/${id}/profile`, { auth: true });
  },

  adminDeleteUser(id) {
    return request(`/admin/users/${id}`, { method: 'DELETE', auth: true });
  },

  adminUpdateUser(id, payload) {
    return request(`/admin/users/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  adminGetCompanyVerifications() {
    return request('/admin/verifications/company', { auth: true });
  },

  adminUpdateCompanyVerification(id, payload) {
    return request(`/admin/verifications/company/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  adminGetStudentVerifications() {
    return request('/admin/verifications/student', { auth: true });
  },

  adminUpdateStudentVerification(id, payload) {
    return request(`/admin/verifications/student/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  adminGetCategories() {
    return request('/admin/categories', { auth: true });
  },

  adminCreateCategory(payload) {
    return request('/admin/categories', { method: 'POST', auth: true, body: payload });
  },

  adminUpdateCategory(id, payload) {
    return request(`/admin/categories/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  adminDeleteCategory(id) {
    return request(`/admin/categories/${id}`, { method: 'DELETE', auth: true });
  },

  adminGetCategoryInternships(id) {
    return request(`/admin/categories/${id}/internships`, { auth: true });
  },

  adminGetSkills() {
    return request('/admin/skills', { auth: true });
  },

  adminCreateSkill(payload) {
    return request('/admin/skills', { method: 'POST', auth: true, body: payload });
  },

  adminUpdateSkill(id, payload) {
    return request(`/admin/skills/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  adminDeleteSkill(id) {
    return request(`/admin/skills/${id}`, { method: 'DELETE', auth: true });
  },

  adminGetSkillInternships(id) {
    return request(`/admin/skills/${id}/internships`, { auth: true });
  },

  adminGetInternship(id) {
    return request(`/admin/internships/${id}`, { auth: true });
  },

  adminUpdateInternship(id, payload) {
    return request(`/admin/internships/${id}`, { method: 'PUT', auth: true, body: payload });
  },

  adminFlagInternship(id, payload = {}) {
    return request(`/admin/internships/${id}/flag`, { method: 'PUT', auth: true, body: payload });
  },

  adminUnflagInternship(id) {
    return request(`/admin/internships/${id}/unflag`, { method: 'PUT', auth: true });
  },

  adminGetJobTypes() {
    return request('/admin/job-types', { auth: true });
  },

  companyCreateVerification(payload) {
    return request('/verification/company', { method: 'POST', auth: true, body: payload });
  },

  companyGetVerificationRequests() {
    return request('/verification/company/mine', { auth: true });
  },

  // Notification endpoints
  getNotifications(params = {}) {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return request(`/notifications${query ? `?${query}` : ''}`, { auth: true });
  },

  markNotificationAsRead(id) {
    return request(`/notifications/${id}/read`, { method: 'PUT', auth: true });
  },

  markAllNotificationsAsRead() {
    return request('/notifications/mark-all-read', { method: 'PUT', auth: true });
  },

  deleteNotification(id) {
    return request(`/notifications/${id}`, { method: 'DELETE', auth: true });
  },
};

export default api;
