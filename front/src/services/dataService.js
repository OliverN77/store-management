import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://store-backend-erezhdh5hmbhggf3.brazilsouth-01.azurewebsites.net/api',
  timeout: 10000,
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper para obtener el userId del usuario autenticado
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id;
};

// Generic CRUD service con userId automático
export const createCrudService = (endpoint) => ({
  getAll: () => {
    const userId = getUserId();
    return api.get(`${endpoint}${userId ? `?userId=${userId}` : ''}`);
  },
  getById: (id) => api.get(`${endpoint}/${id}`),
  create: (data) => {
    const userId = getUserId();
    const dataWithUserId = { ...data, UserId: userId };
    return api.post(endpoint, dataWithUserId);
  },
  update: (id, data) => {
    const userId = getUserId();
    const dataWithUserId = { ...data, UserId: userId };
    return api.put(`${endpoint}/${id}`, dataWithUserId);
  },
  delete: (id) => {
    const userId = getUserId();
    return api.delete(`${endpoint}/${id}${userId ? `?userId=${userId}` : ''}`);
  },
});

// Specific services for each entity
export const customerService = createCrudService('/customers');
export const vendorService = createCrudService('/vendors');
export const itemService = createCrudService('/items');
export const salesHeaderService = createCrudService('/sales-headers');
export const salesLineService = createCrudService('/sales-lines');
export const purchaseHeaderService = createCrudService('/purchase-headers');
export const purchaseLineService = createCrudService('/purchase-lines');
export const itemLedgerEntryService = createCrudService('/item-ledger-entries');
export const paymentTermsService = createCrudService('/payment-terms');

// Auth service
export const authService = {
  sendCode: async (email) => {
    const response = await api.post('/auth/send-code', { email });
    return response.data;
  },
  
  verifyCode: async (email, code, firstName, lastName) => {
    const response = await api.post('/auth/verify-code', { 
      email, 
      code,
      firstName,
      lastName
    });
    return response.data;
  }
};

// Dashboard service - MODIFICADO para usar userId
export const dashboardService = {
  getStats: (userId) => api.get(`/dashboard/stats/${userId}`),
  getRecentActivity: (userId) => api.get(`/dashboard/recent-activity/${userId}`),
  getLowStock: (userId) => api.get(`/dashboard/low-stock/${userId}`),
  getActivePurchaseOrders: (userId) => api.get(`/dashboard/active-purchases/${userId}`)
};

export default api;
