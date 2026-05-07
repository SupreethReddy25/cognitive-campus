import axios from 'axios';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me')
};

// ─── Skills ───
export const skillsService = {
  getAllSkills: () => api.get('/skills'),
  getMySkillStates: () => api.get('/skills/my-states')
};

export const problemsService = {
  getProblems: (params = {}) => api.get('/problems', { params }),
  getProblemById: (id) => api.get(`/problems/${id}`),
  getAiNudge: (id, code, language, nudgeDepth = 1, lastError = null) => api.post(`/problems/${id}/nudge`, { code, language, nudgeDepth, lastError }),
  proposeProblem: (data) => api.post('/problems/propose', data)
};

// ─── Submissions ───
export const submissionsService = {
  createSubmission: (data) => api.post('/submissions', data),
  getHistory: (params = {}) => api.get('/submissions/history', { params }),
  runCode: (data) => api.post('/submissions/run', data),
  getRecentSubmissions: (problemId) => api.get(`/submissions/recent/${problemId}`)
};

// ─── Leaderboard ───
export const leaderboardService = {
  getLeaderboard: () => api.get('/leaderboard')
};

export const usersService = {
  getProfile: () => api.get('/users/profile'),
  getRecommendations: () => api.get('/users/recommendations'),
  configGeminiKey: (apiKey) => api.post('/users/config-key', { apiKey })
};

export default api;
