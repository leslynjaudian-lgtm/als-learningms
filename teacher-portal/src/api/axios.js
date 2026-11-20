import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

// Normalize baseURL so that '/api' is consistently present whether the user enters
// 'https://backend.railway.app' or 'https://backend.railway.app/api'
export const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') || rawApiUrl.endsWith('/api/')
      ? rawApiUrl.replace(/\/+$/, '')
      : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

// Base backend origin without /api (e.g. 'https://backend.railway.app' or '')
export const BACKEND_URL = rawApiUrl
  ? rawApiUrl.replace(/\/api\/?$/, '')
  : '';

export function resolveAssetUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('data:') ||
    str.startsWith('blob:')
  ) {
    return str;
  }
  if (!BACKEND_URL) {
    return str.startsWith('/') ? str : `/${str}`;
  }
  return `${BACKEND_URL}${str.startsWith('/') ? '' : '/'}${str}`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('als_teacher_token') || localStorage.getItem('als_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
