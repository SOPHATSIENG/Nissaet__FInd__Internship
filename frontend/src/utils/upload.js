import { authStorage } from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const requestPresign = async ({ filename, contentType, size, purpose = 'verification', auth = false }) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = authStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const endpoint = auth ? '/uploads/presign/company' : '/uploads/presign';
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename, contentType, size, purpose })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to create upload URL.');
  }
  return data;
};

export const uploadFileToS3 = async ({ file, purpose = 'verification', auth = false }) => {
  if (!file) throw new Error('File is required.');
  const { uploadUrl, fileUrl } = await requestPresign({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    purpose,
    auth
  });

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!uploadRes.ok) {
    throw new Error('File upload failed.');
  }

  return fileUrl;
};

export const getFileLabel = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] || value);
  } catch {
    return String(value);
  }
};

