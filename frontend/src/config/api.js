const fallbackBase =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:5001';
const backendUrl = import.meta.env.VITE_BACKEND_URL || fallbackBase;
const rawApiBase = import.meta.env.VITE_API_BASE_URL;

const resolveApiBase = () => {
  if (rawApiBase) {
    if (/^https?:\/\//i.test(rawApiBase)) {
      return rawApiBase.replace(/\/+$/, '');
    }
    if (rawApiBase.startsWith('/')) {
      return `${backendUrl.replace(/\/+$/, '')}${rawApiBase}`;
    }
    return `${backendUrl.replace(/\/+$/, '')}/${rawApiBase}`;
  }
  return `${backendUrl.replace(/\/+$/, '')}/api`;
};

export const API_URL = resolveApiBase();

console.log('API Base URL:', API_URL);
