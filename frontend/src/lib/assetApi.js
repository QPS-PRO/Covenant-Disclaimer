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
    
    // Face recognition specific endpoints
    updateFaceData: (id, faceData) => apiPatch(`/api/employees/${id}/`, { 
        face_recognition_data: faceData 
    }),
    verifyFace: (employeeId, faceData) => apiPost('/api/employees/verify-face/', {
        employee_id: employeeId,
        face_data: faceData
    }),
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
    // Face verification for transactions
    createWithFaceVerification: (data, faceData) => apiPost('/api/transactions/', {
        ...data,
        face_verification_data: faceData
    }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiGet('/api/dashboard/stats/'),
};
// Face Recognition Utilities
export const faceRecognitionAPI = {
    // Simulate face recognition comparison
    compareFaces: (storedFaceData, capturedFaceData) => {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // In a real implementation, this would call a face recognition service
                // For demo purposes, we'll simulate with random success rate
                const similarity = Math.random();
                const threshold = 0.7; // 70% similarity threshold
                
                resolve({
                    success: similarity >= threshold,
                    confidence: similarity,
                    threshold: threshold
                });
            }, 1500);
        });
    },
    
    // Process face data for storage
    processFaceData: (imageData) => {
        return new Promise((resolve) => {
            // Simulate face encoding extraction
            setTimeout(() => {
                // In a real implementation, this would extract face encodings
                // For demo, we'll just store the image data with a timestamp
                const processedData = {
                    encodings: btoa(imageData), // Base64 encode for demo
                    timestamp: new Date().toISOString(),
                    quality: Math.random() > 0.2 ? 'good' : 'poor' // Simulate quality check
                };
                
                resolve(processedData);
            }, 1000);
        });
    }
};