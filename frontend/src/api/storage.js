export const storage = {
  setToken(token) {
    localStorage.setItem('token', token);
  },

  getToken() {
    return localStorage.getItem('token');
  },

  removeToken() {
    localStorage.removeItem('token');
  },

  setTokenTimestamp(timestamp) {
    localStorage.setItem('tokenTimestamp', timestamp.toString());
  },

  getTokenTimestamp() {
    const timestamp = localStorage.getItem('tokenTimestamp');
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  removeTokenTimestamp() {
    localStorage.removeItem('tokenTimestamp');
  },

  setUserEmail(email) {
    localStorage.setItem('userEmail', email);
  },

  getUserEmail() {
    return localStorage.getItem('userEmail');
  },

  removeUserEmail() {
    localStorage.removeItem('userEmail');
  },

  clearAuth() {
    this.removeToken();
    this.removeTokenTimestamp();
    this.removeUserEmail();
  },
};
