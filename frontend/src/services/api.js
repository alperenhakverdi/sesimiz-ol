import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error?.message || 'Bir hata oluştu';
    return Promise.reject(new Error(errorMessage));
  }
);

// User API functions
export const userAPI = {
  // Create new user
  create: async (userData) => {
    return await api.post('/users', userData);
  },

  // Get user profile
  getProfile: async (userId) => {
    return await api.get(`/users/${userId}`);
  },

  // Update user profile
  update: async (userId, userData) => {
    return await api.put(`/users/${userId}`, userData);
  },

  // Get user's stories
  getStories: async (userId) => {
    return await api.get(`/users/${userId}/stories`);
  },
};

// Auth API functions
export const authAPI = {
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },
  verifyOtp: async ({ token, otp }) => {
    return await api.post('/auth/verify-otp', { token, otp });
  },
  resetPassword: async ({ resetToken, password }) => {
    return await api.post('/auth/reset-password', { resetToken, password });
  }
};

// Story API functions
export const storyAPI = {
  // Get all stories with pagination
  getAll: async (page = 1, limit = 10) => {
    return await api.get(`/stories?page=${page}&limit=${limit}`);
  },

  // Get story by ID
  getById: async (storyId) => {
    return await api.get(`/stories/${storyId}`);
  },

  // Create new story
  create: async (storyData) => {
    return await api.post('/stories', storyData);
  },

  // Update story
  update: async (storyId, storyData) => {
    return await api.put(`/stories/${storyId}`, storyData);
  },

  // Delete story
  delete: async (storyId, authorId) => {
    return await api.delete(`/stories/${storyId}`, {
      data: { authorId }
    });
  },

  // Increment view count
  incrementView: async (storyId) => {
    return await api.post(`/stories/${storyId}/view`);
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return await api.get('/health');
  },
};

// Notification API functions
export const notificationAPI = {
  list: async (params = {}) => {
    return await api.get('/notifications', { params });
  },
  markRead: async (id) => {
    return await api.put(`/notifications/${id}/read`);
  },
  markBulk: async (ids = []) => {
    return await api.put('/notifications/bulk/read', { ids });
  },
  markAll: async () => {
    return await api.put('/notifications/all/read');
  }
};

export default api;
