export const getAuthToken = () => {
    return localStorage.getItem('access_token');
};

export const setAuthToken = (token) => {
    localStorage.setItem('access_token', token);
};

export const removeAuthToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
};

export const getUserData = () => {
    try {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

export const setUserData = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
};