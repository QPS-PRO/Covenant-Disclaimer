import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// Department API
export const departmentAPI = {
    getAll: () => apiGet('/api/departments/'),
    getById: (id) => apiGet(`/api/departments/${id}/`),
    create: (data) => apiPost('/api/departments/', data),
    update: (id, data) => apiPatch(`/api/departments/${id}/`, data),
    delete: (id) => apiDelete(`/api/departments/${id}/`),
};

// Employee API
export const employeeAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/employees/${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiGet(`/api/employees/${id}/`),
    getProfile: (id) => apiGet(`/api/employees/${id}/profile/`),
    create: (data) => apiPost('/api/employees/', data),
    update: (id, data) => apiPatch(`/api/employees/${id}/`, data),
    delete: (id) => apiDelete(`/api/employees/${id}/`),
};

// Asset API
export const assetAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/assets/${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiGet(`/api/assets/${id}/`),
    create: (data) => apiPost('/api/assets/', data),
    update: (id, data) => apiPatch(`/api/assets/${id}/`, data),
    delete: (id) => apiDelete(`/api/assets/${id}/`),
};

// Transaction API
export const transactionAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/transactions/${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id) => apiGet(`/api/transactions/${id}/`),
    create: (data) => apiPost('/api/transactions/', data),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiGet('/api/dashboard/stats/'),
};