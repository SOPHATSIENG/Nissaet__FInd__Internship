const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export const API_URL = `${backendUrl}/api`;

console.log('API Base URL:', API_URL);
