import React, { useState, useEffect } from 'react';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      backgroundColor: '#dc3545', color: 'white', textAlign: 'center',
      padding: '12px 20px', fontWeight: 500, fontSize: '14px'
    }}>
      <i className="ti ti-wifi-off me-2"></i>
      No internet connection. Please check your network and try again.
    </div>
  );
};

export default OfflineBanner;
