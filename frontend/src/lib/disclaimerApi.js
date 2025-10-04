import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

// ============ ADMIN API ============
export const disclaimerAdminAPI = {
    // Department configuration
    getDepartmentConfigs: () => apiGet('/api/disclaimers/admin/department-config/'),
    createDepartmentConfig: (data) => apiPost('/api/disclaimers/admin/department-config/', data),
    updateDepartmentConfig: (id, data) => apiPatch(`/api/disclaimers/admin/department-config/${id}/`, data),
    deleteDepartmentConfig: (id) => apiDelete(`/api/disclaimers/admin/department-config/${id}/`),
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
    }
};