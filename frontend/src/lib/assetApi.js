import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import cameraManager from './cameraManager';

// Department API with pagination
export const departmentAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/departments/${queryString ? `?${queryString}` : ""}`);
    },

    getAllForDropdown: (search = '') => {
        const params = search ? { search } : {};
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/departments/all/${queryString ? `?${queryString}` : ""}`);
    },

    getById: (id) => apiGet(`/api/departments/${id}/`),
    create: (data) => apiPost('/api/departments/', data),
    update: (id, data) => apiPatch(`/api/departments/${id}/`, data),
    delete: (id) => apiDelete(`/api/departments/${id}/`),
};

// Employee API with pagination
export const employeeAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/employees/${queryString ? `?${queryString}` : ''}`);
    },

    getAllForDropdown: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/employees/all/${queryString ? `?${queryString}` : ''}`);
    },

    getById: (id) => apiGet(`/api/employees/${id}/`),
    getProfile: (id) => apiGet(`/api/employees/${id}/profile/`),
    create: (data) => apiPost('/api/employees/', data),
    update: (id, data) => apiPatch(`/api/employees/${id}/`, data),
    delete: (id) => apiDelete(`/api/employees/${id}/`),
    getCurrentAssets: (id) => apiGet(`/api/employees/${id}/current-assets/`),
    getStats: (id) => apiGet(`/api/employees/${id}/stats/`),
    getTransactionHistory: (id, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/employees/${id}/transactions/${queryString ? `?${queryString}` : ''}`);
    },
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

// Asset API with pagination
export const assetAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/assets/${queryString ? `?${queryString}` : ''}`);
    },

    getAllForDropdown: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/assets/all/${queryString ? `?${queryString}` : ''}`);
    },

    getById: (id) => apiGet(`/api/assets/${id}/`),
    create: (data) => apiPost('/api/assets/', data),
    update: (id, data) => apiPatch(`/api/assets/${id}/`, data),
    delete: (id) => apiDelete(`/api/assets/${id}/`),
};

// Transaction API with pagination
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

    createReturn: (data) => apiPost('/api/transactions/return/', data),
    bulkReturn: (data) => apiPost('/api/transactions/bulk-return/', data),
    getTransactionDetails: (id) => apiGet(`/api/transactions/${id}/details/`),
    
    // Get recent transactions for dashboard (limited, no pagination)
    getRecent: (limit = 5) => apiGet(`/api/transactions/?ordering=-transaction_date&page=1&page_size=${limit}`),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiGet('/api/dashboard/stats/'),

    getAssetStatusDistribution: () => apiGet('/api/dashboard/stats/').then(data => ({
        assigned: data.assets_assigned,
        available: data.assets_available,
        maintenance: data.assets_maintenance || 0,
        retired: data.assets_retired || 0
    })),

    getWeeklyTransactions: () => apiGet('/api/dashboard/stats/').then(data => data.weekly_data),

    getDepartmentDistribution: () => apiGet('/api/dashboard/stats/').then(data => data.department_distribution),

    // Get comprehensive dashboard data in one call
    getAllDashboardData: async (recentLimit = 5) => {
        try {
            const [stats, recentTransactions] = await Promise.all([
                dashboardAPI.getStats(),
                transactionAPI.getRecent(recentLimit)
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

// Enhanced Face Recognition API using camera manager
export const faceRecognitionAPI = {
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

    // Start camera stream using camera manager
    startCamera: async (constraints) => {
        try {
            return await cameraManager.startCamera(constraints);
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Could not access camera. Please check permissions.');
        }
    },

    // Stop camera stream using camera manager
    stopCamera: (stream) => {
        cameraManager.stopCamera();
    },

    // Check if camera is active
    isCameraActive: () => {
        return cameraManager.isStreamActive();
    },

    // Get active stream
    getActiveStream: () => {
        return cameraManager.getActiveStream();
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
    },

    // Cleanup camera resources
    cleanup: () => {
        cameraManager.cleanup();
    }
};

// Camera utilities using camera manager
export const cameraUtils = {
    // Check if camera is available
    isCameraAvailable: async () => {
        return await cameraManager.checkCameraAvailability();
    },

    // Get available cameras
    getAvailableCameras: async () => {
        return await cameraManager.getAvailableCameras();
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
    }),

    // Check if a stream is active
    isStreamActive: () => {
        return cameraManager.isStreamActive();
    }
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


// Asset return specific API
export const assetReturnAPI = {
    // Process asset return with face verification
    processReturn: async (assetId, employeeId, returnData, faceVerificationData) => {
        return apiPost('/api/assets/return/', {
            asset_id: assetId,
            employee_id: employeeId,
            return_condition: returnData.return_condition,
            damage_notes: returnData.damage_notes,
            notes: returnData.notes,
            face_verification_data: faceVerificationData
        });
    },

    // Get return history for an asset
    getAssetReturnHistory: (assetId) => apiGet(`/api/assets/${assetId}/return-history/`),

    // Get return statistics
    getReturnStats: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiGet(`/api/returns/stats/${queryString ? `?${queryString}` : ''}`);
    }
};

// Utility functions for employee profile
export const employeeProfileUtils = {
    // Format employee data for display
    formatEmployeeData: (employee) => ({
        ...employee,
        displayName: employee.name || `${employee.first_name} ${employee.last_name}`,
        avatar: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'User')}&background=0d47a1&color=fff&size=128`,
        memberSince: formatters.formatDate(employee.created_at || employee.date_joined),
        isActive: employee.is_active ?? true,
        hasFaceData: employee.has_face_data ?? false,
    }),

    // Calculate employee activity score
    calculateActivityScore: (stats) => {
        if (!stats) return 0;
        const totalTransactions = stats.total_transactions || 0;
        const currentAssets = stats.current_assets_count || 0;
        const faceVerificationRate = stats.face_verification_rate || 0;
        
        // Simple scoring algorithm
        return Math.min(100, (totalTransactions * 2) + (currentAssets * 5) + (faceVerificationRate * 10));
    },

    // Get employee status color
    getEmployeeStatusColor: (employee) => {
        if (!employee.is_active) return 'red';
        if (!employee.has_face_data) return 'orange';
        return 'green';
    },

    // Get employee status text
    getEmployeeStatusText: (employee) => {
        if (!employee.is_active) return 'Inactive';
        if (!employee.has_face_data) return 'Missing Face Data';
        return 'Active';
    }
};

// Enhanced formatters for profile page
export const profileFormatters = {
    ...formatters, // Include existing formatters

    // Format asset condition with color
    formatAssetCondition: (condition) => {
        const conditionColors = {
            'Excellent': 'green',
            'Good': 'green', 
            'Fair': 'yellow',
            'Poor': 'orange',
            'Damaged': 'red',
            'Broken': 'red'
        };
        return {
            text: condition,
            color: conditionColors[condition] || 'gray'
        };
    },

    // Format verification status with details
    formatVerificationStatus: (isVerified, confidence) => {
        if (isVerified && confidence) {
            return {
                text: `Verified (${(confidence * 100).toFixed(1)}%)`,
                color: 'green',
                icon: 'check'
            };
        } else if (isVerified) {
            return {
                text: 'Verified',
                color: 'green', 
                icon: 'check'
            };
        } else {
            return {
                text: 'Not Verified',
                color: 'red',
                icon: 'x'
            };
        }
    },

    // Format transaction summary
    formatTransactionSummary: (transaction) => ({
        id: transaction.id,
        type: transaction.transaction_type,
        assetName: transaction.asset_name,
        date: formatters.formatDate(transaction.transaction_date),
        verification: profileFormatters.formatVerificationStatus(
            transaction.face_verification_success,
            transaction.face_verification_confidence
        ),
        condition: transaction.return_condition ? 
            profileFormatters.formatAssetCondition(transaction.return_condition) : null,
        hasNotes: !!(transaction.notes || transaction.damage_notes)
    })
};

// Profile page specific constants
export const PROFILE_CONSTANTS = {
    TABS: {
        OVERVIEW: 'overview',
        ASSETS: 'assets', 
        HISTORY: 'history'
    },
    
    ASSET_CONDITIONS: [
        { value: 'Excellent', label: 'Excellent - Like new', color: 'green' },
        { value: 'Good', label: 'Good - No issues', color: 'green' },
        { value: 'Fair', label: 'Fair - Minor wear', color: 'yellow' },
        { value: 'Poor', label: 'Poor - Significant wear', color: 'orange' },
        { value: 'Damaged', label: 'Damaged - Needs repair', color: 'red' },
        { value: 'Broken', label: 'Broken - Not functional', color: 'red' }
    ],
    
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 50
    }
};