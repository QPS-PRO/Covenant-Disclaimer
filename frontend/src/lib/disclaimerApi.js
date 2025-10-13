import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

// ============ ADMIN API ============
export const disclaimerAdminAPI = {
    // Department configuration
    getDepartmentConfigs: () => apiGet('/api/disclaimers/admin/department-config/'),
    createDepartmentConfig: (data) => apiPost('/api/disclaimers/admin/department-config/', data),
    updateDepartmentConfig: (id, data) => apiPatch(`/api/disclaimers/admin/department-config/${id}/`, data),
    deleteDepartmentConfig: (id) => apiDelete(`/api/disclaimers/admin/department-config/${id}/`),
    getDepartmentsSummary: () => apiGet('/api/disclaimers/admin/departments/summary/'),
    getDepartmentDisclaimerOrders: (departmentId) => 
        apiGet(`/api/disclaimers/admin/departments/${departmentId}/disclaimer-orders/`),
    createDepartmentDisclaimerOrder: (departmentId, data) => 
        apiPost(`/api/disclaimers/admin/departments/${departmentId}/disclaimer-orders/create/`, data),
    reorderDepartmentDisclaimerOrders: (departmentId, orders) => 
        apiPut(`/api/disclaimers/admin/departments/${departmentId}/disclaimer-orders/reorder/`, { orders }),
    deleteDepartmentDisclaimerOrder: (departmentId, orderId) => 
        apiDelete(`/api/disclaimers/admin/departments/${departmentId}/disclaimer-orders/${orderId}/delete/`),
};

// ============ DEPARTMENT MANAGER API ============
export const disclaimerManagerAPI = {
    // Disclaimer flow configuration
    getDisclaimerOrders: () => apiGet('/api/disclaimers/manager/disclaimer-orders/'),
    createDisclaimerOrder: (data) => apiPost('/api/disclaimers/manager/disclaimer-orders/create/', data),
    reorderDisclaimerOrders: (orders) => apiPut('/api/disclaimers/manager/disclaimer-orders/reorder/', { orders }),
    deleteDisclaimerOrder: (id) => apiDelete(`/api/disclaimers/manager/disclaimer-orders/${id}/delete/`),

    // Review requests
    getPendingRequests: () => apiGet('/api/disclaimers/manager/pending-requests/'),
    reviewRequest: (requestId, data) => apiPost(`/api/disclaimers/manager/requests/${requestId}/review/`, data),

    // Statistics
    getStatistics: () => apiGet('/api/disclaimers/statistics/'),

    // FIXED: use apiGet and the /api/disclaimers/... base path
    getAllRequests: async () => {
        try {
            const data = await apiGet('/api/disclaimers/manager/all-requests/');
            return data;
        } catch (error) {
            console.error('Error fetching all requests:', error);
            throw error;
        }
    },
};

// ============ EMPLOYEE API ============
export const disclaimerEmployeeAPI = {
    // Disclaimer process
    getStatus: () => apiGet('/api/disclaimers/employee/status/'),
    startProcess: () => apiPost('/api/disclaimers/employee/start-process/', {}),
    submitRequest: (data) => apiPost('/api/disclaimers/employee/submit-request/', data),
    getHistory: () => apiGet('/api/disclaimers/employee/history/'),
};

// ============ UTILITY FUNCTIONS ============
export const disclaimerUtils = {
    // Get status color
    getStatusColor: (status) => {
        const colors = {
            'pending': 'yellow',
            'approved': 'green',
            'rejected': 'red',
            'locked': 'gray',
            'in_progress': 'blue',
            'completed': 'green',
            'blocked': 'red'
        };
        return colors[status] || 'gray';
    },

    // Get status label
    getStatusLabel: (status) => {
        const labels = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'locked': 'Locked',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'blocked': 'Blocked'
        };
        return labels[status] || status;
    },

    // Format date
    formatDate: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    // NEW: Format date without time
    formatDateOnly: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    // Check if step is accessible
    isStepAccessible: (step) => {
        return step.is_active && step.can_request;
    },

    // Get step icon
    getStepIcon: (step) => {
        if (step.is_completed) return 'check';
        if (step.status === 'rejected') return 'x';
        if (step.status === 'pending') return 'clock';
        if (step.status === 'locked') return 'lock';
        return 'circle';
    },
    
    // NEW: Calculate process duration
    calculateDuration: (startDate, endDate) => {
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },
    
    // NEW: Get process badge color
    getProcessBadgeColor: (status) => {
        const colors = {
            'in_progress': 'blue',
            'completed': 'green',
            'blocked': 'red'
        };
        return colors[status] || 'gray';
    }
};