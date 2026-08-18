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

// Response interceptor — handle 401 globally with an event
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───
export const authService = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  register:       (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe:          () => api.get('/auth/me'),
  // Live prefix search — fires on every keystroke, from the 3rd char
  searchName:     (q) => api.get('/auth/search-name', { params: { q } }),
  // Exact email lookup (kept as backup)
  peekUser:       (email) => api.get('/auth/peek', { params: { email } }),
  // Bootstrap: promote self to admin (only works when no admins exist yet)
  bootstrapAdmin: () => api.post('/auth/bootstrap-admin'),
};

// ─── Skills ───
export const skillsService = {
  getAllSkills: () => api.get('/skills'),
  getMySkillStates: () => api.get('/skills/my-states')
};

export const problemsService = {
  getProblems: (params = {}) => api.get('/problems', { params }),
  getReviewQueue: (params = {}) => api.get('/problems/review-queue', { params }),
  getProblemById: (id) => api.get(`/problems/${id}`),
  getAiNudge: (id, code, language, nudgeDepth = 1, lastError = null) => api.post(`/problems/${id}/nudge`, { code, language, nudgeDepth, lastError }),
  proposeProblem: (data) => api.post('/problems/propose', data),
  voteProblem: (id, vote) => api.post(`/problems/${id}/vote`, { vote })
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

export const arenaService = {
  getRating: () => api.get('/arena/rating')
};

export const usersService = {
  getProfile: () => api.get('/users/profile'),
  getRecommendations: () => api.get('/users/recommendations'),
  configGeminiKey: (apiKey) => api.post('/users/config-key', { apiKey }),
  getDashboardQuote: (context) => api.post('/users/dashboard-quote', { context }),
  updateProfile: (data) => api.patch('/users/profile', data),
};

// ─── Companies ───
export const companiesService = {
  getCompanies: (params = {}) => api.get('/companies', { params }),
  getCompany: (slug) => api.get(`/companies/${slug}`),
  getCompanyExperiences: (slug) => api.get(`/companies/${slug}/experiences`),
  getCompanyStats: (slug) => api.get(`/companies/${slug}/stats`),
  getRelatedProblems: (slug) => api.get(`/companies/${slug}/related-problems`),
  generatePrepPlan: (slug, days = 30) => api.post(`/companies/${slug}/prep-plan`, { days })
};

// ─── Experiences ───
export const experiencesService = {
  createExperience: (data) => api.post('/experiences', data),
  parseRawDump: (rawText) => api.post('/experiences/ai-parse', { rawText }),
  upvoteExperience: (id) => api.post(`/experiences/${id}/upvote`)
};

// ─── Sheets ───
export const sheetsService = {
  getSheets: (params = {}) => api.get('/sheets', { params }),
  getSheet: (slug) => api.get(`/sheets/${slug}`),
  updateProgress: (slug, data) => api.post(`/sheets/${slug}/progress`, data)
};

// ─── Colleges ───
export const collegesService = {
  getColleges: (params = {}) => api.get('/colleges', { params }),
  getCollege: (slug) => api.get(`/colleges/${slug}`),
  getCollegeDashboard: (slug) => api.get(`/colleges/${slug}/dashboard`),
  getCollegeCompanyIntel: (collegeSlug, companySlug) =>
    api.get(`/colleges/${collegeSlug}/companies/${companySlug}`),
};


export const adminService = {
  getStats:          ()              => api.get('/admin/stats'),
  getStudents:       ()              => api.get('/admin/students'),
  getHeatmap:        ()              => api.get('/admin/heatmap'),
  getExperiences:    (params = {})   => api.get('/admin/experiences', { params }),
  verifyExperience:  (id, action)    => api.patch(`/admin/experiences/${id}/verify`, { action }),
  getProblems:       (params = {})   => api.get('/admin/problems', { params }),
  updateProblemStatus: (id, status)  => api.patch(`/admin/problems/${id}/status`, { status }),
  updateUserRole:    (id, role)      => api.patch(`/admin/users/${id}/role`, { role }),
  createCollege:     (data)          => api.post('/admin/colleges', data),
  createPlacementRecord: (data)      => api.post('/admin/placement-records', data),
};

export default api;
