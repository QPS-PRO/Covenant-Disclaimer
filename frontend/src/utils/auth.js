import parseErrorMessage from "./handleError";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(parseErrorMessage(error));
    }
    
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(parseErrorMessage(error));
    }
    
    return response.json();
  }
};

export const setAuthToken = (token) => {
  localStorage.setItem("token", token);
};

export const setUserData = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const removeAuthToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const getUserData = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
