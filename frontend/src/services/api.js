import axios from 'axios';

const trimTrailingSlashes = (value = '') => String(value).replace(/\/+$/, '');

const resolveApiUrl = () => {
  const configuredApiUrl = trimTrailingSlashes(import.meta.env.VITE_API_URL || '');
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  const hostname = window.location.hostname || '';

  if (
    hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1'
  ) {
    return 'http://localhost:5000/api';
  }

  const fallbackApiUrl = trimTrailingSlashes(import.meta.env.VITE_FALLBACK_API_URL || '');
  if (fallbackApiUrl) {
    return fallbackApiUrl;
  }

  // Production-safe fallback for environments where VITE_API_URL is missing.
  return 'https://edutrack-steel.vercel.app/api';
};

// Base URL for backend API
const API_URL = resolveApiUrl();
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

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

const clearAuthState = () => {
  const storage = getStorage();
  storage?.removeItem(TOKEN_KEY);
  storage?.removeItem(REFRESH_TOKEN_KEY);
  storage?.removeItem(USER_KEY);
  clearLegacyLocalStorage();
};

const getToken = () => {
  clearLegacyLocalStorage();
  return getStorage()?.getItem(TOKEN_KEY);
};

const getRefreshToken = () => {
  clearLegacyLocalStorage();
  return getStorage()?.getItem(REFRESH_TOKEN_KEY);
};

const setTokens = (token, refreshToken) => {
  const storage = getStorage();
  if (storage && token) storage.setItem(TOKEN_KEY, token);
  if (storage && refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  clearLegacyLocalStorage();
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingRequests = [];

const flushPending = (nextToken, error) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(nextToken);
  });
  pendingRequests = [];
};

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login')
      || originalRequest?.url?.includes('/auth/register')
      || originalRequest?.url?.includes('/auth/refresh-token');

    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthState();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((nextToken) => {
          if (!nextToken) {
            return Promise.reject(error);
          }
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const nextToken = refreshResponse?.data?.token;
        const nextRefreshToken = refreshResponse?.data?.refreshToken;

        if (!nextToken || !nextRefreshToken) {
          throw new Error('Token refresh failed');
        }

        setTokens(nextToken, nextRefreshToken);
        flushPending(nextToken, null);

        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushPending(null, refreshError);
        clearAuthState();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

