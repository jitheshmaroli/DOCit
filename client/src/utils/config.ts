export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return '/images/avatar.png';
  // Return Cloudinary URLs directly
  if (path.startsWith('https://res.cloudinary.com')) {
    return path;
  }
  // Handle legacy local paths (remove after migration)
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
