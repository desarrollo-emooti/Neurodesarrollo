import axios from 'axios';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token validation utility
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    // Add 30 seconds buffer to account for clock skew
    return decoded.exp * 1000 < Date.now() + 30000;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Token refresh utility
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
    localStorage.setItem('emooti_token', newToken);
    localStorage.setItem('emooti_refresh_token', newRefreshToken);

    return newToken;
  } catch (error) {
    // Refresh failed, clear tokens and redirect to login
    localStorage.removeItem('emooti_token');
    localStorage.removeItem('emooti_refresh_token');
    window.location.href = '/login';
    throw error;
  }
};

// Request interceptor to add auth token and handle expiration
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('emooti_token');
    const refreshToken = localStorage.getItem('emooti_refresh_token');

    // Skip token validation for refresh endpoint
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }

    // Check if token is expired
    if (token && isTokenExpired(token)) {
      // Token is expired, try to refresh
      if (refreshToken && !isTokenExpired(refreshToken)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshAccessToken(refreshToken);
            isRefreshing = false;
            onRefreshed(newToken);
            config.headers.Authorization = `Bearer ${newToken}`;
          } catch (error) {
            isRefreshing = false;
            return Promise.reject(error);
          }
        } else {
          // Wait for the ongoing refresh to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            });
          });
        }
      } else {
        // Refresh token is also expired, redirect to login
        localStorage.removeItem('emooti_token');
        localStorage.removeItem('emooti_refresh_token');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
      }
    } else if (token) {
      // Token is still valid
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { response, config } = error;

    if (response) {
      const { status, data } = response;

      // Handle rate limiting (429 Too Many Requests)
      if (status === 429) {
        // Get retry delay from header or default to 5 seconds
        const retryAfter = parseInt(response.headers['retry-after']) || 5;

        // Show user-friendly notification
        toast.warning(`Demasiadas solicitudes. Reintentando en ${retryAfter}s...`);

        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

        // Retry the original request
        return api.request(config);
      }

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('emooti_token');
          localStorage.removeItem('emooti_refresh_token');
          window.location.href = '/login';
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          break;

        case 403:
          toast.error('No tienes permisos para realizar esta acción.');
          break;

        case 404:
          toast.error('Recurso no encontrado.');
          break;

        case 422:
          // Validation errors
          if (data.error?.details) {
            data.error.details.forEach(detail => {
              toast.error(detail.message);
            });
          } else {
            toast.error(data.error?.message || 'Error de validación.');
          }
          break;

        case 500:
          toast.error('Error interno del servidor. Por favor, intenta más tarde.');
          break;

        default:
          toast.error(data.error?.message || 'Ha ocurrido un error inesperado.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Other error
      toast.error('Ha ocurrido un error inesperado.');
    }

    return Promise.reject(error);
  }
);

// API Methods
export const apiClient = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // Auth methods
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  },
  
  // User methods
  users: {
    getAll: (params = {}) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    getByIds: (ids, params = {}) => api.post('/users/by-ids', { ids, ...params }),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
    bulkUpdate: (data) => api.post('/users/bulk-update', data),
    bulkDelete: (userIds) => api.post('/users/bulk-delete', { user_ids: userIds }),
    sendAuthorizations: (data) => api.post('/users/send-authorizations', data),
    exportExcel: (data) => api.post('/users/export-excel', data, {
      responseType: 'blob'
    }),
    getRelatedStudents: (userId) => api.get(`/users/${userId}/related-students`),
  },
  
  // Student methods
  students: {
    getAll: (params = {}) => api.get('/students', { params }),
    getById: (id) => api.get(`/students/${id}`),
    create: (studentData) => api.post('/students', studentData),
    update: (id, studentData) => api.put(`/students/${id}`, studentData),
    delete: (id) => api.delete(`/students/${id}`),
    linkFamily: (id, familyData) => api.post(`/students/${id}/link-family`, familyData),
  },
  
  // Center methods
  centers: {
    getAll: (params = {}) => api.get('/centers', { params }),
    getById: (id) => api.get(`/centers/${id}`),
    create: (centerData) => api.post('/centers', centerData),
    update: (id, centerData) => api.put(`/centers/${id}`, centerData),
    delete: (id) => api.delete(`/centers/${id}`),
  },
  
  // Test Assignment methods
  testAssignments: {
    getAll: (params = {}) => api.get('/test-assignments', { params }),
    getById: (id) => api.get(`/test-assignments/${id}`),
    create: (assignmentData) => api.post('/test-assignments', assignmentData),
    update: (id, assignmentData) => api.put(`/test-assignments/${id}`, assignmentData),
    delete: (id) => api.delete(`/test-assignments/${id}`),
  },
  
  // Test Result methods
  testResults: {
    getAll: (params = {}) => api.get('/test-results', { params }),
    getById: (id) => api.get(`/test-results/${id}`),
    create: (resultData) => api.post('/test-results', resultData),
    update: (id, resultData) => api.put(`/test-results/${id}`, resultData),
    delete: (id) => api.delete(`/test-results/${id}`),
  },
  
  // EmotiTest methods
  emotiTests: {
    getAll: (params = {}) => api.get('/emoti-tests', { params }),
    getById: (id) => api.get(`/emoti-tests/${id}`),
    create: (testData) => api.post('/emoti-tests', testData),
    update: (id, testData) => api.put(`/emoti-tests/${id}`, testData),
    delete: (id) => api.delete(`/emoti-tests/${id}`),
    getStatistics: (id) => api.get(`/emoti-tests/${id}/statistics`),
    getByAge: (age) => api.get(`/emoti-tests/by-age/${age}`),
  },
  
  // Agenda methods
  agenda: {
    getAll: (params = {}) => api.get('/agenda', { params }),
    getById: (id) => api.get(`/agenda/${id}`),
    create: (eventData) => api.post('/agenda', eventData),
    update: (id, eventData) => api.put(`/agenda/${id}`, eventData),
    delete: (id) => api.delete(`/agenda/${id}`),
  },
  
  // Device methods
  devices: {
    getAll: (params = {}) => api.get('/devices', { params }),
    getById: (id) => api.get(`/devices/${id}`),
    create: (deviceData) => api.post('/devices', deviceData),
    update: (id, deviceData) => api.put(`/devices/${id}`, deviceData),
    delete: (id) => api.delete(`/devices/${id}`),
    getReservations: (id, params = {}) => api.get(`/devices/${id}/reservations`, { params }),
    createReservation: (id, reservationData) => api.post(`/devices/${id}/reservations`, reservationData),
  },
  
  // Inventory methods
  inventory: {
    getAll: (params = {}) => api.get('/inventory', { params }),
    getById: (id) => api.get(`/inventory/${id}`),
    create: (itemData) => api.post('/inventory', itemData),
    update: (id, itemData) => api.put(`/inventory/${id}`, itemData),
    delete: (id) => api.delete(`/inventory/${id}`),
  },
  
  // Subscription methods
  subscriptions: {
    getAll: (params = {}) => api.get('/subscriptions', { params }),
    getById: (id) => api.get(`/subscriptions/${id}`),
    create: (subscriptionData) => api.post('/subscriptions', subscriptionData),
    update: (id, subscriptionData) => api.put(`/subscriptions/${id}`, subscriptionData),
    delete: (id) => api.delete(`/subscriptions/${id}`),
    getBillings: (id) => api.get(`/subscriptions/${id}`),
    generateBilling: (id, billingData) => api.post(`/subscriptions/${id}/generate-billing`, billingData),
  },
  
  // Invoice methods
  invoices: {
    getAll: (params = {}) => api.get('/invoices', { params }),
    getById: (id) => api.get(`/invoices/${id}`),
    create: (invoiceData) => api.post('/invoices', invoiceData),
    update: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
    delete: (id) => api.delete(`/invoices/${id}`),
    generatePdf: (id) => api.post(`/invoices/${id}/generate-pdf`),
    sendEmail: (id) => api.post(`/invoices/${id}/send-email`),
    markAsPaid: (id, data) => api.post(`/invoices/${id}/mark-as-paid`, data),
    createCreditNote: (id, data) => api.post(`/invoices/${id}/credit-note`, data),
    getStatistics: () => api.get('/invoices/statistics/overview'),
  },
  
  // Security methods
  security: {
    getDashboard: () => api.get('/security/dashboard'),
    getAuditLogs: (params = {}) => api.get('/security/audit-logs', { params }),
    getAnomalyAlerts: (params = {}) => api.get('/security/anomaly-alerts', { params }),
    updateAnomalyAlert: (id, data) => api.put(`/security/anomaly-alerts/${id}`, data),
    getRetentionPolicies: (params = {}) => api.get('/security/retention-policies', { params }),
    createRetentionPolicy: (data) => api.post('/security/retention-policies', data),
    updateRetentionPolicy: (id, data) => api.put(`/security/retention-policies/${id}`, data),
    deleteRetentionPolicy: (id) => api.delete(`/security/retention-policies/${id}`),
    getAnonymizationLogs: (params = {}) => api.get('/security/anonymization-logs', { params }),
    createAnonymizationLog: (data) => api.post('/security/anonymization-logs', data),
  },
  
  // Configuration methods
  configuration: {
    getValueConfigurations: (params = {}) => api.get('/configuration/value-configurations', { params }),
    createValueConfiguration: (data) => api.post('/configuration/value-configurations', data),
    updateValueConfiguration: (id, data) => api.put(`/configuration/value-configurations/${id}`, data),
    deleteValueConfiguration: (id) => api.delete(`/configuration/value-configurations/${id}`),
    getCompanyConfiguration: () => api.get('/configuration/company'),
    updateCompanyConfiguration: (data) => api.put('/configuration/company', data),
    getImportTemplates: (params = {}) => api.get('/configuration/import-templates', { params }),
    createImportTemplate: (data) => api.post('/configuration/import-templates', data),
    updateImportTemplate: (id, data) => api.put(`/configuration/import-templates/${id}`, data),
    deleteImportTemplate: (id) => api.delete(`/configuration/import-templates/${id}`),
    getBackupConfigurations: (params = {}) => api.get('/configuration/backup-configurations', { params }),
    createBackupConfiguration: (data) => api.post('/configuration/backup-configurations', data),
    updateBackupConfiguration: (id, data) => api.put(`/configuration/backup-configurations/${id}`, data),
    deleteBackupConfiguration: (id) => api.delete(`/configuration/backup-configurations/${id}`),
  },
  
  // Authorization methods
  authorizations: {
    getAll: (params = {}) => api.get('/authorizations', { params }),
    getById: (id) => api.get(`/authorizations/${id}`),
    create: (authData) => api.post('/authorizations', authData),
    update: (id, authData) => api.put(`/authorizations/${id}`, authData),
    delete: (id) => api.delete(`/authorizations/${id}`),
  },
  
  // Export methods
  export: {
    exportData: (params = {}) => api.get('/export/data', { params }),
    exportUsers: (params = {}) => api.get('/export/users', { params }),
    exportStudents: (params = {}) => api.get('/export/students', { params }),
    exportTestResults: (params = {}) => api.get('/export/test-results', { params }),
  },
  
  // Import methods
  import: {
    importData: (formData) => api.post('/import/data', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getImportStatus: (id) => api.get(`/import/status/${id}`),
  },
  
  // Tutorial methods
  tutorials: {
    getAll: (params = {}) => api.get('/tutorials', { params }),
    getById: (id) => api.get(`/tutorials/${id}`),
    create: (tutorialData) => api.post('/tutorials', tutorialData),
    update: (id, tutorialData) => api.put(`/tutorials/${id}`, tutorialData),
    delete: (id) => api.delete(`/tutorials/${id}`),
  },
  
  // Report methods
  reports: {
    getAll: (params = {}) => api.get('/reports', { params }),
    getById: (id) => api.get(`/reports/${id}`),
    generate: (reportData) => api.post('/reports/generate', reportData),
    download: (id) => api.get(`/reports/${id}/download`),
  },
  
  // Statistics methods
  statistics: {
    getDashboard: () => api.get('/statistics/dashboard'),
    getDashboardCharts: () => api.get('/statistics/dashboard-charts'),
    getUsers: (params = {}) => api.get('/statistics/users', { params }),
    getStudents: (params = {}) => api.get('/statistics/students', { params }),
    getTestResults: (params = {}) => api.get('/statistics/test-results', { params }),
    getCenters: (params = {}) => api.get('/statistics/centers', { params }),
  },
  
  // Database methods (Admin only)
  database: {
    getEntities: (params = {}) => api.get('/database/entities', { params }),
    getEntityData: (entity, params = {}) => api.get(`/database/entities/${entity}`, { params }),
  },
  
  // Profile methods
  profile: {
    get: () => api.get('/profile'),
    update: (data) => api.put('/profile', data),
    changePassword: (data) => api.put('/profile/password', data),
    getActivity: (params = {}) => api.get('/profile/activity', { params }),
    getStatistics: () => api.get('/profile/statistics'),
  },
  
  // Public methods (no auth required)
  public: {
    submitTest: (testData) => api.post('/public/test-submission', testData),
    getTestForm: (testId) => api.get(`/public/test-form/${testId}`),
  },
};

export default apiClient;
