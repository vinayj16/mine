import React from 'react';
import { ToastContainer as ReactToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export const showToast = ({ type, message, duration = 3000 }: ToastProps) => {
  toast[type](message, {
    position: 'top-right',
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
  });
};

export const showSuccessToast = (message: string, duration?: number) => {
  showToast({ type: 'success', message, duration });
};

export const showErrorToast = (message: string, duration?: number) => {
  showToast({ type: 'error', message, duration });
};

export const showInfoToast = (message: string, duration?: number) => {
  showToast({ type: 'info', message, duration });
};

export const showWarningToast = (message: string, duration?: number) => {
  showToast({ type: 'warning', message, duration });
};

export const ToastContainer: React.FC = () => {
  return (
    <ReactToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
};

export default ToastContainer;
