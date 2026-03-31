const fallbackBase =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:5001';
const backendUrl = import.meta.env.VITE_BACKEND_URL || fallbackBase;

export const API_URL = `${backendUrl}/api`;

console.log('API Base URL:', API_URL);
