import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/config';

let isRefreshing = false;
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
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await api.post('/api/auth/refresh-token');

        const retryResponse = await api(originalRequest);

        failedRequestsQueue.forEach(({ resolve }) => resolve(undefined));
        failedRequestsQueue = [];

        return retryResponse;
      } catch (refreshError) {
        failedRequestsQueue.forEach(({ reject }) => reject(refreshError));
        failedRequestsQueue = [];

        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
          try {
            await api.post('/api/auth/logout');
          } catch (logoutError) {
            console.error('Logout failed:', logoutError);
          }
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject({ message, status });
  }
);

export default api;