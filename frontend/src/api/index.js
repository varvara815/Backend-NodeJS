import axios from 'axios';
import { storage } from './storage.js';

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if ([401, 403].includes(error.response?.status) && 
        originalRequest.url !== '/auth/login' && 
        originalRequest.url !== '/auth/register' &&
        originalRequest.url !== '/auth/verify') {
      storage.clearAuth();
      window.dispatchEvent(new CustomEvent('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export default api;