import api from './api';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
let inMemoryToken = null;
let inMemoryRefreshToken = null;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

const clearLegacyLocalStorage = () => {
  if (typeof window === 'undefined') return;
  // ? SECURITY FIX: Remove legacy JWT persistence in localStorage.
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, refreshToken, user } = response.data || {};

      if (token) this.setToken(token);
      if (refreshToken) this.setRefreshToken(refreshToken);
      if (user) this.setUser(user);

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data || {};

      if (token) this.setToken(token);
      if (refreshToken) this.setRefreshToken(refreshToken);
      if (user) this.setUser(user);

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  setToken(token) {
    const storage = getStorage();
    inMemoryToken = token || null;
    if (storage && token) storage.setItem(TOKEN_KEY, token);
    clearLegacyLocalStorage();
  },

  getToken() {
    if (inMemoryToken) return inMemoryToken;
    const storage = getStorage();
    const token = storage?.getItem(TOKEN_KEY) || null;
    inMemoryToken = token;
    clearLegacyLocalStorage();
    return token;
  },

  setRefreshToken(token) {
    const storage = getStorage();
    inMemoryRefreshToken = token || null;
    if (storage && token) storage.setItem(REFRESH_TOKEN_KEY, token);
    clearLegacyLocalStorage();
  },

  getRefreshToken() {
    if (inMemoryRefreshToken) return inMemoryRefreshToken;
    const storage = getStorage();
    const token = storage?.getItem(REFRESH_TOKEN_KEY) || null;
    inMemoryRefreshToken = token;
    clearLegacyLocalStorage();
    return token;
  },

  setUser(user) {
    const storage = getStorage();
    if (storage && user) storage.setItem(USER_KEY, JSON.stringify(user));
    clearLegacyLocalStorage();
  },

  getCurrentUser() {
    const storage = getStorage();
    const user = storage?.getItem(USER_KEY);
    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  getUserRole() {
    return this.getCurrentUser()?.role || null;
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  logout(redirect = true) {
    const storage = getStorage();
    inMemoryToken = null;
    inMemoryRefreshToken = null;
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(REFRESH_TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    clearLegacyLocalStorage();
    if (redirect) window.location.href = '/login';
  }
};

export default authService;

