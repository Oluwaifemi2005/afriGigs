import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gigafrik_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clear error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Job endpoints
export const jobApi = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs', jobData),
  acceptJob: (id) => api.patch(`/jobs/${id}/accept`),
  submitDeliverable: (id, deliverableData) => api.patch(`/jobs/${id}/submit`, deliverableData),
  approveJob: (id, reviewData) => api.patch(`/jobs/${id}/approve`, reviewData),
  getClientJobs: () => api.get('/jobs/client/my-jobs'),
  getDeveloperJobs: () => api.get('/jobs/developer/my-jobs'),
  seedData: () => api.post('/seed'),
};

export default api;
