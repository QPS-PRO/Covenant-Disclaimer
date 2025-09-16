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
    updateFaceData: (id, faceImageData) => apiPost(`/api/employees/${id}/face/`, {
        face_recognition_data: faceImageData
    }),
    verifyFace: (employeeId, faceData) => apiPost('/api/employees/verify-face/', {
        employee_id: employeeId,
        face_data: faceData
    }),
    validateFaceImage: (faceImageData) => apiPost('/api/employees/validate-face-image/', {
        face_image_data: faceImageData
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
    // Get recent transactions for dashboard
    getRecent: (limit = 10) => apiGet(`/api/transactions/?ordering=-transaction_date&limit=${limit}`),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiGet('/api/dashboard/stats/'),

    // Additional dashboard specific methods
    getAssetStatusDistribution: () => apiGet('/api/dashboard/stats/').then(data => ({
        assigned: data.assets_assigned,
        available: data.assets_available,
        maintenance: data.assets_maintenance || 0,
        retired: data.assets_retired || 0
    })),

    getWeeklyTransactions: () => apiGet('/api/dashboard/stats/').then(data => data.weekly_data),

    getDepartmentDistribution: () => apiGet('/api/dashboard/stats/').then(data => data.department_distribution),

    // Get comprehensive dashboard data in one call
    getAllDashboardData: async () => {
        try {
            const [stats, recentTransactions] = await Promise.all([
                dashboardAPI.getStats(),
                transactionAPI.getRecent(10)
            ]);

            return {
                stats,
                recentTransactions: recentTransactions.results || recentTransactions || [],
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }
};

// Real Face Recognition Utilities
export const faceRecognitionAPI = {
    // Capture image from video element
    captureImageFromVideo: (videoElement, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;

                if (canvas.width === 0 || canvas.height === 0) {
                    reject(new Error('Video not ready'));
                    return;
                }

                context.drawImage(videoElement, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', quality);
                resolve(imageData);
            } catch (error) {
                reject(error);
            }
        });
    },

    // Start camera stream
    startCamera: async (constraints = { video: { width: 640, height: 480, facingMode: 'user' } }) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Could not access camera. Please check permissions.');
        }
    },

    // Stop camera stream
    stopCamera: (stream) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    },

    // Validate image quality before processing
    validateImageQuality: async (imageData) => {
        try {
            return await employeeAPI.validateFaceImage(imageData);
        } catch (error) {
            console.error('Error validating image:', error);
            return {
                is_valid: false,
                issues: ['Image validation failed'],
                recommendations: ['Please try again with a clear image']
            };
        }
    },

    // Register employee face
    registerEmployeeFace: async (employeeId, imageData) => {
        try {
            // First validate the image
            const validation = await faceRecognitionAPI.validateImageQuality(imageData);

            if (!validation.is_valid) {
                return {
                    success: false,
                    error: 'Image quality validation failed',
                    issues: validation.issues,
                    recommendations: validation.recommendations
                };
            }

            // Register the face
            const result = await employeeAPI.updateFaceData(employeeId, imageData);
            return result;
        } catch (error) {
            console.error('Error registering face:', error);
            return {
                success: false,
                error: 'Face registration failed',
                details: error.message
            };
        }
    },

    // Verify employee face
    verifyEmployeeFace: async (employeeId, imageData) => {
        try {
            const result = await employeeAPI.verifyFace(employeeId, imageData);
            return result;
        } catch (error) {
            console.error('Error verifying face:', error);
            return {
                success: false,
                error: 'Face verification failed',
                details: error.message
            };
        }
    }
};

// Camera utilities
export const cameraUtils = {
    // Check if camera is available
    isCameraAvailable: async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            return false;
        }
    },

    // Get available cameras
    getAvailableCameras: async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            return [];
        }
    },

    // Get optimal camera constraints
    getOptimalConstraints: () => ({
        video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
        },
        audio: false
    })
};

// Export utility functions for data formatting
export const formatters = {
    // Format date for display
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format numbers with commas
    formatNumber: (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    },

    // Get status color for assets
    getAssetStatusColor: (status) => {
        const statusColors = {
            'available': 'green',
            'assigned': 'blue',
            'maintenance': 'orange',
            'retired': 'red'
        };
        return statusColors[status] || 'gray';
    },

    // Get transaction type color
    getTransactionTypeColor: (type) => {
        return type === 'issue' ? 'green' : 'blue';
    },

    // Get face verification status color
    getFaceVerificationColor: (isVerified) => {
        return isVerified ? 'green' : 'red';
    },

    // Format confidence score
    formatConfidence: (confidence) => {
        return `${(confidence * 100).toFixed(1)}%`;
    }
};