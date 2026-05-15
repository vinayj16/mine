import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './index.css';
import { useAuthStore } from './store/authStore';

// Clear old data on app load
const clearOldData = () => {
  try {
    const version = localStorage.getItem('appVersion');
    if (version !== '2.0') {
      localStorage.clear();
      localStorage.setItem('appVersion', '2.0');
    }
  } catch (e) { console.warn('localStorage error:', e); }
};
clearOldData();

// Infinite loop prevention
let redirectCount = 0;
const MAX_REDIRECTS = 3;

const handleUnauthorized = () => {
  redirectCount++;
  console.warn(`[Auth] Unauthorized access detected (attempt ${redirectCount}/${MAX_REDIRECTS}). Redirecting to login...`);
  
  // Prevent infinite redirect loops
  if (redirectCount > MAX_REDIRECTS) {
    console.error('[Auth] Too many redirects detected. Stopping to prevent infinite loop.');
    return;
  }
  
  // Clear auth state and tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Handle service unavailable
 * Shows user-friendly message
 */
function handleServiceUnavailable() {
  console.error('[Service] Service temporarily unavailable');
}

// Global error handler for uncaught promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason?.message || reason?.toString() || '';
  
  // Suppress React's javascript: URL security warning
  if (message.includes('React has blocked a javascript: URL')) {
    event.preventDefault();
    return;
  }
  
  // Suppress jQuery slimScroll errors
  if (message.includes('slimScroll') || message.includes('jQuery') || message.includes('Deferred')) {
    event.preventDefault();
    return;
  }
  
  console.error('[Unhandled Rejection]', event.reason);
  
  // Check if it's an API error
  if (event.reason?.response) {
    const status = event.reason.response.status;
    const errorMessage = event.reason.response.data?.error?.message || 'An error occurred';
    
    // Handle specific status codes
    if (status === 401) {
      handleUnauthorized();
    } else if (status === 503) {
      handleServiceUnavailable();
    } else if (status >= 500) {
      console.error('[Server Error]', errorMessage);
    }
  }
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  const message = event.error?.message || event.message || '';
  
  // Suppress React's javascript: URL security warning
  if (message.includes('React has blocked a javascript: URL')) {
    event.preventDefault();
    return;
  }
  
  // Suppress jQuery slimScroll errors
  if (message.includes('slimScroll') || message.includes('jQuery') || message.includes('Deferred')) {
    event.preventDefault();
    return;
  }
  
  console.error('[Uncaught Error]', event.error);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
}

const renderApp = () => {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const bootstrapApp = async () => {
  console.log('[Bootstrap] Starting application...');
  
  // Clear any leftover demo keys from older builds
  const demoKeys = [
    'demoModeActive',
    'demoModeUser', 
    'selectedUserRole',
    'demo_institutions',
    'demo_file_manager'
  ];
  
  demoKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Reset redirect counter on bootstrap
  redirectCount = 0;
  
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const authService = (await import('./api/authService')).default;
      const user = await authService.getProfile();
      if (user) {
        useAuthStore.setState({
          user: user as any,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        console.log('Login successful:', user?.name || user?.email || 'User');
      }
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      // Clear invalid token and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  } else {
    console.log('No valid token found, showing home page');
  }
};

// Bootstrap the application
bootstrapApp();

// Log environment info in development
if (import.meta.env.DEV) {
  console.log('[APP] Started in development mode');
  console.log('Auth store state:', useAuthStore.getState());
  console.log('[API] URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');
  console.log('[ENV] Environment:', import.meta.env.MODE);
  console.log('[ENV] Node Version:', import.meta.env.VITE_NODE_VERSION || 'unknown');
}

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60); // Check every hour
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
      });
  });
}

// Performance monitoring in development
if (import.meta.env.DEV && 'performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (perfData) {
      console.log('[Performance] Page Load Time:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
      console.log('[Performance] DOM Content Loaded:', Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart), 'ms');
    }
  });
}

// Detect online/offline status
window.addEventListener('online', () => {
  console.log('[Network] Connection restored');
});

window.addEventListener('offline', () => {
  console.warn('[Network] Connection lost. Working in offline mode.');
});

// Log initial network status
if (import.meta.env.DEV) {
  console.log('[Network] Status:', navigator.onLine ? 'Online' : 'Offline');
}

renderApp();