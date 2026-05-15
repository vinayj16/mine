import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageHeader from '../components/layout/PageHeader';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';

const SuperAdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleSidebar = () => {
    if (isMobileView) setIsMobileOpen(prev => !prev);
    else setIsSidebarCollapsed(prev => !prev);
  };

  const sidebarWidth = isMobileView ? 0 : (isSidebarCollapsed ? 80 : 280);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <SuperAdminSidebar
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {isMobileView && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: isMobileView ? 0 : sidebarWidth,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Header toggleSidebar={toggleSidebar} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', marginTop: '60px' }}>
          <PageHeader showBreadcrumbs={true} />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;