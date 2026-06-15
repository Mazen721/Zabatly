const DEFAULT_API_URL = 'https://zabatly-production.up.railway.app';

function normalizeApiUrl(url) {
  const trimmed = String(url || DEFAULT_API_URL).trim().replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const localHost = /^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed);
  return `${localHost ? 'http' : 'https'}://${trimmed}`;
}

export const API = normalizeApiUrl(import.meta.env.VITE_API_URL);
