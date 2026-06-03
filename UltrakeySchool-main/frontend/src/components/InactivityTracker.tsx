import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const WARNING_DURATION = 5 * 60 * 1000;

const InactivityTracker = () => {
  const { isAuthenticated, logout } = useAuthStore() as any;
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(Math.floor(WARNING_DURATION / 1000));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    if (showWarning) {
      setShowWarning(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.floor(WARNING_DURATION / 1000));

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, showWarning]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    resetInactivityTimer();

    const events = ['mousedown', 'mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'wheel'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  if (!showWarning) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="modal-backdrop fade show"
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        style={{ zIndex: 10000 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-warning shadow-lg">
            <div className="modal-header border-warning bg-warning bg-opacity-10">
              <h5 className="modal-title">
                <i className="ti ti-alarm-clock me-2 text-warning"></i>
                Inactivity Detected
              </h5>
            </div>
            <div className="modal-body text-center py-4">
              <i className="ti ti-timer-off fs-48 text-warning mb-3 d-block"></i>
              <h5 className="mb-2">You've been inactive for a while</h5>
              <p className="text-muted mb-3">
                Move your mouse or press any key to dismiss
              </p>
            </div>
            <div className="modal-footer justify-content-center border-0 pt-0">
              <button
                className="btn btn-primary px-4"
                onClick={resetInactivityTimer}
              >
                <i className="ti ti-refresh me-1"></i> Stay Logged In
              </button>
              <button
                className="btn btn-outline-danger px-4"
                onClick={async () => {
                  setShowWarning(false);
                  if (countdownRef.current) clearInterval(countdownRef.current);
                  await logout();
                }}
              >
                <i className="ti ti-logout me-1"></i> Logout Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityTracker;
