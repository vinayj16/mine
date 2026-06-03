import { useState, useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import router from './router';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import InactivityTracker from './components/InactivityTracker';

const MAINTENANCE_CHECK_INTERVAL = 20000;
const LOADING_TIMEOUT_MS = 5000;

function App() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const authUser = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedInRef = useRef(false); // track previous auth state for login detection

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Safety timeout — never stay loading forever
  useEffect(() => {
    loadingTimerRef.current = setTimeout(() => {
      setLoading(false);
    }, LOADING_TIMEOUT_MS);
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const shouldBlockForMaintenance = (settings: any): boolean => {
    if (!settings?.enabled) return false;
    const now = Date.now();
    // If startTime set and it's still in the future → don't block yet
    if (settings.startTime) {
      const startMs = new Date(settings.startTime).getTime();
      if (!isNaN(startMs) && startMs > now) return false;
    }
    // If endTime set and it's already past → don't block anymore
    if (settings.endTime) {
      const endMs = new Date(settings.endTime).getTime();
      if (!isNaN(endMs) && endMs <= now) return false;
    }
    return true;
  };

  const checkAndRedirect = async (): Promise<void> => {
    // Already on the maintenance page — no need to check again
    if (window.location.pathname.includes('/under-maintenance')) return;
    // Is the current user a superadmin? If so, never block.
    if (isSuperAdminNow()) return;

    try {
      const res = await fetch('/api/v1/super-admin/settings/maintenance');
      if (!res.ok) {
        // 503 means maintenance IS on but response body still has the info
        if (res.status === 503) {
          const body = await res.json();
          if (body?.data?.maintenance) {
            redirectToUnderMaintenance();
            return;
          }
        }
        return;
      }
      const data = await res.json();
      const settings = data?.data || data;
      if (shouldBlockForMaintenance(settings)) {
        redirectToUnderMaintenance();
      }
    } catch {
      // Backend unreachable — allow access (no point blocking if API is down)
    }
  };

  // ── Initial mount + periodic poll ──
  useEffect(() => {
    checkAndRedirect().finally(() => setLoading(false));

    intervalRef.current = setInterval(() => {
      checkAndRedirect();
    }, MAINTENANCE_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Intentionally run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Detect login/logout (authUser changes) — re-check maintenance ──
  useEffect(() => {
    if (authUser) {
      isLoggedInRef.current = true;
      checkAndRedirect();
    } else {
      isLoggedInRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // ── Runtime 503 event listener ──
  useEffect(() => {
    const handler = () => {
      if (!isSuperAdminNow()) {
        redirectToUnderMaintenance();
      }
    };
    window.addEventListener('app:maintenance', handler);
    return () => window.removeEventListener('app:maintenance', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <InactivityTracker />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </>
  );
}

// ── Pure helpers (no hooks) ──

function isSuperAdminNow(): boolean {
  // 1) Check auth store first (most reliable)
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.role) {
    const role = storeUser.role.toLowerCase();
    if (role === 'superadmin' || role === 'super_admin') return true;
  }
  // 2) Fallback to JWT decode
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = (payload.role || '').toLowerCase();
    return role === 'superadmin' || role === 'super_admin';
  } catch {
    return false;
  }
}

function redirectToUnderMaintenance(): void {
  if (!window.location.pathname.includes('/under-maintenance')) {
    window.location.href = '/under-maintenance';
  }
}

export default App;
