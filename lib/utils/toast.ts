import { toast as sonnerToast } from "sonner";

// Custom toast wrapper that adds data-testid attributes
export const toast = {
  success: (message: string, options?: any) => {
    const toastId = sonnerToast.success(message, options);
    // Add data-testid after toast is created
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-sonner-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.setAttribute('data-testid', 'success-notification');
      }
    }, 10);
    return toastId;
  },
  error: (message: string, options?: any) => {
    const toastId = sonnerToast.error(message, options);
    // Add data-testid after toast is created
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-sonner-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.setAttribute('data-testid', 'error-notification');
      }
    }, 10);
    return toastId;
  },
  info: (message: string, options?: any) => {
    const toastId = sonnerToast.info(message, options);
    // Add data-testid after toast is created
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-sonner-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.setAttribute('data-testid', 'info-notification');
      }
    }, 10);
    return toastId;
  },
  warning: (message: string, options?: any) => {
    const toastId = sonnerToast.warning(message, options);
    // Add data-testid after toast is created
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-sonner-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.setAttribute('data-testid', 'warning-notification');
      }
    }, 10);
    return toastId;
  },
};