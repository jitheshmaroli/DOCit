import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ROUTES } from '../constants/routeConstants';
import { HttpStatusCode } from '../constants/HttpStatusCode';

let isRefreshing = false;
type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};
let failedRequestsQueue: FailedRequest[] = [];

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;
    const data = error.response?.data as { message?: string; error?: string };

    if (
      status === HttpStatusCode.FORBIDDEN &&
      data?.error === 'ForbiddenError' &&
      data?.message === 'User is blocked'
    ) {
      try {
        await api.post(ROUTES.API.AUTH.LOGOUT);
        window.location.href = ROUTES.PUBLIC.LOGIN;
      } catch (logoutError) {
        console.error('Logout failed:', logoutError);
      }
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject({ message: data?.message, status });
    }

    if (
      status === HttpStatusCode.UNAUTHORIZED &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Prevent refresh for auth-related endpoints
      if (
        originalRequest.url?.includes(ROUTES.API.AUTH.REFRESH_TOKEN) ||
        originalRequest.url?.includes(ROUTES.API.AUTH.LOGOUT)
      ) {
        console.error('401 error on auth endpoint:', data?.message);
        return Promise.reject({ message: data?.message, status });
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await api.post(ROUTES.API.AUTH.REFRESH_TOKEN);
        // Process queued requests
        failedRequestsQueue.forEach(({ resolve }) => resolve(undefined));
        failedRequestsQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        failedRequestsQueue.forEach(({ reject }) => reject(refreshError));
        failedRequestsQueue = [];

        if (
          axios.isAxiosError(refreshError) &&
          refreshError.response?.status === 401
        ) {
          try {
            await api.post(ROUTES.API.AUTH.LOGOUT);
          } catch (logoutError) {
            console.error('Logout failed:', logoutError);
          }
          window.dispatchEvent(new Event('auth:logout'));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.error('API error:', {
      message: data?.message,
      status,
      url: originalRequest?.url,
    });
    return Promise.reject({ message: data?.message, status });
  }
);

export default api;
