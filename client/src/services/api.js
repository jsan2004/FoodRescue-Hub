const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('food_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Public
  getImpactStats: () => request('/impact-stats'),

  // In-App Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, {
    method: 'POST'
  }),
  markAllNotificationsRead: () => request('/notifications/read-all', {
    method: 'POST'
  }),

  // Donations
  getAvailableDonations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/donations/available${query ? `?${query}` : ''}`);
  },
  getDonationById: (id) => request(`/donations/${id}`),
  createDonation: (donationData) => request('/donations', {
    method: 'POST',
    body: JSON.stringify(donationData)
  }),
  getMyDonations: () => request('/donations/donor/my'),
  cancelDonation: (id) => request(`/donations/${id}/cancel`, {
    method: 'POST'
  }),
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('food_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload food photograph');
    }
    return data;
  },

  // NGO
  claimDonation: (payload) => request('/ngo/accept', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getNgoDonations: () => request('/ngo/my-donations'),
  updateNgoDeliveryStatus: (payload) => request('/ngo/update-status', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAvailableVolunteers: () => request('/ngo/volunteers'),

  // Volunteer
  getVolunteerTasks: () => request('/volunteer/tasks'),
  updateVolunteerTaskStatus: (payload) => request('/volunteer/update-status', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateVolunteerAvailability: (payload) => request('/volunteer/availability', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateVolunteerProfile: (payload) => request('/volunteer/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Admin
  getAllDonationsAdmin: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/donations${query ? `?${query}` : ''}`);
  },
  getNgosAdmin: () => request('/admin/ngos'),
  verifyNgo: (ngo_id, status) => request('/admin/ngos/verify', {
    method: 'POST',
    body: JSON.stringify({ ngo_id, status })
  }),
  getUsersAdmin: () => request('/admin/users'),
  getAnalyticsAdmin: () => request('/admin/analytics'),

  // Research Evaluation (Section 10)
  recordEvaluation: (record) => request('/evaluation/record', {
    method: 'POST',
    body: JSON.stringify(record)
  }),
  getEvaluationMetrics: () => request('/evaluation/metrics')
};
