import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const getAuthConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') =>
  error.response?.data?.message
  || (error.request ? 'Cannot reach the API. Make sure the integrated server is running.' : fallbackMessage);
