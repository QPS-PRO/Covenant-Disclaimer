import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper for blob downloads
const downloadBlob = async (url) => {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: {
            'Authorization': token ? `Token ${token}` : '',
        },
        responseType: 'blob',
    });
    return response.data;
};

// Helper for JSON API calls
const apiGet = async (url) => {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: {
            'Authorization': token ? `Token ${token}` : '',
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

// ============ REPORTS API ============
export const reportsAPI = {
    // Get list of all available reports
    getReportsList: () => apiGet('/api/reports/'),

    // Disclaimer Reports
    getDisclaimerCompletionReport: (format = 'pdf') => 
        downloadBlob(`/api/reports/disclaimer-completion/?format=${format}`),

    // Asset Reports
    getEmployeeAssetsReport: (format = 'pdf') => 
        downloadBlob(`/api/reports/employee-assets/?format=${format}`),

    getAssetsByStatusReport: (format = 'pdf') => 
        downloadBlob(`/api/reports/assets-by-status/?format=${format}`),

    getTransactionHistoryReport: (format = 'pdf', startDate = null, endDate = null) => {
        let url = `/api/reports/transaction-history/?format=${format}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
        return downloadBlob(url);
    },

    // Department Reports
    getDepartmentSummaryReport: (format = 'pdf') => 
        downloadBlob(`/api/reports/department-summary/?format=${format}`),
};

// ============ UTILITY FUNCTIONS ============
export const reportsUtils = {
    // Download a report file
    downloadReport: (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    // Get report file extension
    getFileExtension: (format) => {
        return format === 'excel' ? 'xlsx' : 'pdf';
    },

    // Generate filename with date
    generateFilename: (reportName, format) => {
        const date = new Date().toISOString().split('T')[0];
        const ext = reportsUtils.getFileExtension(format);
        return `${reportName}_${date}.${ext}`;
    },

    // Get report icon
    getReportIcon: (reportId) => {
        const icons = {
            'disclaimer-completion': 'FileText',
            'employee-assets': 'Package',
            'assets-by-status': 'BarChart3',
            'transaction-history': 'History',
            'department-summary': 'Building2'
        };
        return icons[reportId] || 'FileText';
    },

    // Get report color
    getReportColor: (reportId) => {
        const colors = {
            'disclaimer-completion': 'blue',
            'employee-assets': 'green',
            'assets-by-status': 'purple',
            'transaction-history': 'orange',
            'department-summary': 'indigo'
        };
        return colors[reportId] || 'gray';
    }
};