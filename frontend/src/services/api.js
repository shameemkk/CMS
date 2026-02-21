const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = 'cms_token';

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.success === false) {
    const message = data.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  auth: {
    login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    adminLogin: (payload) => request('/api/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
    register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => request('/api/auth/me'),
    changePassword: (payload) => request('/api/auth/change-password', { method: 'PUT', body: JSON.stringify(payload) }),
    logout: () => setToken(null),
  },
  users: {
    profile: () => request('/api/users/profile'),
    updateProfile: (payload) => request('/api/users/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    byRole: (role) => request(`/api/users/by-role${buildQuery({ role })}`),
    pending: () => request('/api/users/pending'),
    updateStatus: (id, status) => request(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    list: (params) => request(`/api/users${buildQuery(params)}`),
    promoteStudents: () => request('/api/users/promote-students', { method: 'POST' }),
  },
  dashboard: {
    stats: () => request('/api/dashboard/stats'),
  },
  attendance: {
    mark: (payload) => request('/api/attendance', { method: 'POST', body: JSON.stringify(payload) }),
    markBulk: (payload) => request('/api/attendance/bulk', { method: 'POST', body: JSON.stringify(payload) }),
    list: (params) => request(`/api/attendance${buildQuery(params)}`),
    stats: (params) => request(`/api/attendance/stats${buildQuery(params)}`),
  },
  timetable: {
    list: (params) => request(`/api/timetable${buildQuery(params)}`),
    upsert: (payload) => request('/api/timetable', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/timetable/${id}`, { method: 'DELETE' }),
  },
  exams: {
    list: (params) => request(`/api/exams${buildQuery(params)}`),
    create: (payload) => request('/api/exams', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/exams/${id}`, { method: 'DELETE' }),
  },
  results: {
    list: (params) => request(`/api/results${buildQuery(params)}`),
    create: (payload) => request('/api/results', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/results/${id}`, { method: 'DELETE' }),
  },
  assignments: {
    list: (params) => request(`/api/assignments${buildQuery(params)}`),
    create: (payload) => request('/api/assignments', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/assignments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/assignments/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: (params) => request(`/api/notifications${buildQuery(params)}`),
    create: (payload) => request('/api/notifications', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/notifications/${id}`, { method: 'DELETE' }),
  },
  leaveRequests: {
    list: (params) => request(`/api/leave-requests${buildQuery(params)}`),
    create: (payload) => request('/api/leave-requests', { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (id, payload) => request(`/api/leave-requests/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/leave-requests/${id}`, { method: 'DELETE' }),
  },
  subjects: {
    list: (params) => request(`/api/subjects${buildQuery(params)}`),
    create: (payload) => request('/api/subjects', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/subjects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/subjects/${id}`, { method: 'DELETE' }),
  },
  token: {
    get: getToken,
    set: setToken,
    clear: () => setToken(null),
  },
};

