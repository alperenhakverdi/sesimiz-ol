import axios from 'axios';
import {
  logoutHandler,
  csrfTokenHandler,
  isRefreshing,
  setIsRefreshing,
  getFailedQueue,
  addToFailedQueue,
  clearFailedQueue,
} from './authHandlers';

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

const processQueue = (error) => {
  getFailedQueue().forEach(({ reject, resolve }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  clearFailedQueue();
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || '';

    // Don't try to refresh token for session endpoint or if already retried
    if (status === 401 && !originalRequest._retry && !url.includes('/auth/session')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addToFailedQueue({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      setIsRefreshing(true);

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newCsrf = refreshResponse.data?.csrfToken;
        if (newCsrf) {
          csrfTokenHandler(newCsrf);
        }
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Only call logout if it's not a session check
        if (!url.includes('/auth/session')) {
          await logoutHandler({ skipServer: true });
        }
        return Promise.reject(refreshError);
      } finally {
        setIsRefreshing(false);
      }
    }

    const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu';
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

  // Fetch predefined and popular tag suggestions
  getTagSuggestions: async () => {
    return await api.get('/stories/tag-suggestions');
  }
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

// Comments API functions
export const commentAPI = {
  // Get comments for a story
  getByStory: async (storyId, sort = 'newest') => {
    return await api.get(`/comments/story/${storyId}?sort=${sort}`);
  },

  // Create new comment
  create: async (commentData) => {
    return await api.post('/comments', commentData);
  },

  // Delete comment
  delete: async (commentId) => {
    return await api.delete(`/comments/${commentId}`);
  },

  // React to comment
  react: async (commentId) => {
    return await api.post(`/comments/${commentId}/react`);
  },

  // Report comment
  report: async (commentId, reportData) => {
    return await api.post(`/comments/${commentId}/report`, reportData);
  }
};

export { api };
export default api;