export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const getImageUrl = (path: string | undefined): string => {
  return path
    ? `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
    : '/images/avatar.png';
};
