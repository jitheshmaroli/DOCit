import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/config';

// Flag to track if a refresh is in progress
let isRefreshing = false;
// Queue to store failed requests during refresh
type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};
let failedRequestsQueue: FailedRequest[] = [];

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle 401 errors and refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.response?.statusText ||
      'An error occurred';

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Call refresh token endpoint
        await api.post('/api/auth/refresh-token');

        // Retry the original request
        const retryResponse = await api(originalRequest);

        // Resolve all queued requests
        failedRequestsQueue.forEach(({ resolve }) => resolve(undefined));
        failedRequestsQueue = [];

        return retryResponse;
      } catch (refreshError) {
        // Reject all queued requests
        failedRequestsQueue.forEach(({ reject }) => reject(refreshError));
        failedRequestsQueue = [];

        // Handle refresh token failure
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          // Optionally call logout to clear cookies
          try {
            await api.post('/api/auth/logout');
          } catch (logoutError) {
            console.error('Logout failed:', logoutError);
          }
          // Redirect to login page
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, return a structured error
    return Promise.reject({ message, status });
  }
);

export default api;