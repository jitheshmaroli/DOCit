import { ToastContent, TypeOptions } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

export const toastConfig: Partial<ToastOptions> = {
  position: 'top-right' as const,
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: 'custom-toast',
  progressClassName: 'custom-toast-progress',
  style: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
};

export const showToast = async (
  message: ToastContent,
  type: TypeOptions = 'info',
  options: Partial<ToastOptions> = {}
): Promise<void> => {
  const { toast } = await import('react-toastify');

  const toastOptions: Partial<ToastOptions> = {
    ...toastConfig,
    toastId: `toast-${Date.now()}`,
    ...options,
  };

  switch (type) {
    case 'success':
      toast.success(message, toastOptions);
      return;
    case 'error':
      toast.error(message, toastOptions);
      return;
    case 'warning':
      toast.warn(message, toastOptions);
      return;
    case 'info':
    default:
      toast.info(message, toastOptions);
      return;
  }
};

export const showSuccess = (message: ToastContent, options?: Partial<ToastOptions>): Promise<void> =>
  showToast(message, 'success', options);

export const showError = (message: ToastContent, options?: Partial<ToastOptions>): Promise<void> =>
  showToast(message, 'error', options);

export const showWarning = (message: ToastContent, options?: Partial<ToastOptions>): Promise<void> =>
  showToast(message, 'warning', options);

export const showInfo = (message: ToastContent, options?: Partial<ToastOptions>): Promise<void> =>
  showToast(message, 'info', options);