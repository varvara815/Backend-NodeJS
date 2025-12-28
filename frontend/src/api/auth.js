import api from './index.js';
import { storage } from './storage.js';
import { TOKEN_EXPIRY } from '../constants.js';

export const authAPI = {
  tokenCheckInterval: null,

  async register(email, password) {
    try {
      const response = await api.post('/auth/register', { email, password });
      return { data: response.data, ok: true };
    } catch (error) {
      return { data: error.response?.data, ok: false };
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      storage.setToken(data.token);
      storage.setUserEmail(data.email);
      storage.setTokenTimestamp(Date.now());
      this.startTokenCheck();
      return { data, ok: true };
    } catch (error) {
      return { data: error.response?.data, ok: false };
    }
  },

  logout() {
    storage.clearAuth();
    this.stopTokenCheck();
  },

  getToken() {
    return storage.getToken();
  },

  getUserEmail() {
    return storage.getUserEmail();
  },

  hasToken() {
    return !!storage.getToken();
  },

  isTokenExpired() {
    const timestamp = storage.getTokenTimestamp();
    if (!timestamp) return false; // If no timestamp, don't assume expired
    
    const now = Date.now();
    const tokenAge = now - timestamp;
    
    return tokenAge >= TOKEN_EXPIRY;
  },

  startTokenCheck() {
    this.stopTokenCheck(); // Clear any existing interval
    
    this.tokenCheckInterval = setInterval(() => {
      if (this.hasToken() && this.isTokenExpired()) {
        console.log('Token expired, logging out...');
        this.logout();
        window.dispatchEvent(new CustomEvent('auth-logout', { detail: { reason: 'expired' } }));
      }
    }, 60000); // Check every minute
  },

  stopTokenCheck() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  },

  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      await api.get('/auth/verify');
      return true;
    } catch (error) {
      return false;
    }
  },

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};