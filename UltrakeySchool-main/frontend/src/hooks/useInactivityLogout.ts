import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export const useInactivityLogout = (_enabled: boolean = true) => {
  const { isAuthenticated } = useAuthStore();
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    clearTimers();

    return () => {
      clearTimers();
    };
  }, [isAuthenticated, clearTimers]);

  const resetTimers = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return { resetTimers, showInactivityModal: false, handleInactivityConfirm: () => {}, handleInactivityCancel: () => {} };
};

export default useInactivityLogout;