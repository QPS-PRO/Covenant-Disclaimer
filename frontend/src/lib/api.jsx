import React, { createContext, useContext, useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API utility functions
export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for JWT cookies
        ...options,
    };

    // Add auth token if available and not already in headers
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            // If unauthorized and we have a refresh token, try to refresh
            if (response.status === 401 && localStorage.getItem('refresh_token')) {
                try {
                    const newToken = await authAPI.refreshToken();
                    if (newToken.access) {
                        localStorage.setItem('access_token', newToken.access);
                        // Retry the original request with new token
                        config.headers.Authorization = `Bearer ${newToken.access}`;
                        const retryResponse = await fetch(url, config);
                        if (retryResponse.ok) {
                            const contentType = retryResponse.headers.get('content-type');
                            if (retryResponse.status === 204) return null;
                            if (contentType && contentType.includes('application/json')) {
                                const text = await retryResponse.text();
                                return text ? JSON.parse(text) : null;
                            }
                            return await retryResponse.text();
                        }
                    }
                } catch (refreshError) {
                    // Refresh failed, clear tokens and let the error fall through
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                }
            }

            // const errorData = await response.json().catch(() => ({}));
            // throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
            let errorText = `HTTP error! status: ${response.status}`;
            try {
                const cloned = response.clone();
                const ct = cloned.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const jd = await cloned.json();
                    if (typeof jd === 'string') errorText = jd;
                    else if (jd.error) errorText = jd.error;
                    else if (jd.detail) errorText = jd.detail;
                    else if (jd.message) errorText = jd.message;
                    else {
                        const pairs = Object.entries(jd).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`);
                        if (pairs.length) errorText = pairs.join(' | ');
                    }
                } else {
                    const raw = await cloned.text();
                    if (raw) errorText = raw;
                }
            } catch (_) {}
            throw new Error(errorText);

        }

        if (response.status === 204) {
            return null;
        }

        // Check if response has content to parse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }

        return await response.text();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

export async function apiGet(path, options = {}) {
    return apiRequest(path, { method: 'GET', ...options });
}

export async function apiPost(path, data, options = {}) {
    return apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
    });
}

export async function apiPatch(path, data, options = {}) {
    return apiRequest(path, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
    });
}

export async function apiPut(path, data, options = {}) {
    return apiRequest(path, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
    });
}

export async function apiDelete(path, options = {}) {
    return apiRequest(path, { method: 'DELETE', ...options });
}

// Auth API functions
export const authAPI = {
    login: async (credentials) => {
        const response = await apiPost('/api/auth/login/', credentials);
        return response;
    },

    register: async (userData) => {
        const response = await apiPost('/api/auth/registration/', userData);
        return response;
    },

    logout: async () => {
        try {
            await apiPost('/api/auth/logout/');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear tokens regardless of API call success
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser: async () => {
        return await apiGet('/api/users/profile/');
    },

    refreshToken: async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiPost('/api/auth/token/refresh/', {
            refresh: refreshToken
        });

        return response;
    }
};

// Auth Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Check if user is authenticated on app start
    useEffect(() => {
        if (!initialized) {
            checkAuth();
        }
    }, [initialized]);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('user');

            if (!token) {
                setLoading(false);
                setInitialized(true);
                return;
            }

            // First try to use stored user data
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                }
            }

            // Verify token is still valid by making an API call
            try {
                const userData = await authAPI.getCurrentUser();
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (error) {
                console.error('Auth check failed:', error);
                // Clear invalid tokens
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);

            // Store tokens
            if (response.access_token || response.access) {
                const accessToken = response.access_token || response.access;
                const refreshToken = response.refresh_token || response.refresh;

                localStorage.setItem('access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refresh_token', refreshToken);
                }
            }

            // Get user data
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true, user: userData };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);

            // Store tokens if provided (some setups auto-login after registration)
            if (response.access_token || response.access) {
                const accessToken = response.access_token || response.access;
                const refreshToken = response.refresh_token || response.refresh;

                localStorage.setItem('access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refresh_token', refreshToken);
                }

                // Get user data
                const currentUser = await authAPI.getCurrentUser();
                setUser(currentUser);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(currentUser));
            }

            return { success: true, data: response };
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}


export async function apiGetBlob(path, options = {}) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const url = `${BASE_URL}${path}`;

    console.log('Fetching blob from:', url); // Debug log

    try {
        const resp = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-store',
            headers: {
                Accept: '*/*',
                ...(options.headers || {}),
            },
            credentials: 'include',
        });

        console.log('Response status:', resp.status); // Debug log
        console.log('Response headers:', resp.headers); // Debug log

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            console.error('Error response:', text); // Debug log
            throw new Error(text || `HTTP error! status: ${resp.status}`);
        }

        // Get filename from Content-Disposition header
        const cd = resp.headers.get('content-disposition');
        let filename = null;
        if (cd) {
            const m = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (m && m[1]) {
                filename = m[1].replace(/['"]/g, '');
            }
        }

        const blob = await resp.blob();
        console.log('Blob created:', blob.size, 'bytes'); // Debug log

        return { blob, filename };
    } catch (error) {
        console.error('apiGetBlob error:', error);
        throw error;
    }
}