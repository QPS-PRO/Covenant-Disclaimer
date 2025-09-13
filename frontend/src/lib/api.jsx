// frontend/src/lib/api.jsx
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
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

    // Check if user is authenticated on app start
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Auth check failed:', error);
            // Clear invalid tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            
            // Store tokens
            if (response.access_token) {
                localStorage.setItem('access_token', response.access_token);
            }
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
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
            if (response.access_token) {
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('refresh_token', response.refresh_token);
                
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