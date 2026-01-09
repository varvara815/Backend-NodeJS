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

  setUserId(userId) {
    localStorage.setItem('userId', userId);
  },

  getUserId() {
    return localStorage.getItem('userId');
  },

  removeUserId() {
    localStorage.removeItem('userId');
  },

  setUserRole(role) {
    localStorage.setItem('userRole', role);
  },

  getUserRole() {
    return localStorage.getItem('userRole');
  },

  removeUserRole() {
    localStorage.removeItem('userRole');
  },

  clearAuth() {
    this.removeToken();
    this.removeTokenTimestamp();
    this.removeUserEmail();
    this.removeUserId();
    this.removeUserRole();
  },
};
