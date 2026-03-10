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
    background: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    color: '#1E293B',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    boxShadow:
      '0 8px 24px -4px rgba(15, 165, 233, 0.12), 0 2px 8px -2px rgba(0,0,0,0.06)',
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

export const showSuccess = (
  message: ToastContent,
  options?: Partial<ToastOptions>
): Promise<void> => showToast(message, 'success', options);

export const showError = (
  message: ToastContent,
  options?: Partial<ToastOptions>
): Promise<void> => showToast(message, 'error', options);

export const showWarning = (
  message: ToastContent,
  options?: Partial<ToastOptions>
): Promise<void> => showToast(message, 'warning', options);

export const showInfo = (
  message: ToastContent,
  options?: Partial<ToastOptions>
): Promise<void> => showToast(message, 'info', options);
