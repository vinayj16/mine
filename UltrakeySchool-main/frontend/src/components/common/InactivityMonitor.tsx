import React from 'react';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { useAuth } from '../../store/authStore';

/**
 * Component that monitors user inactivity and logs them out after a timeout.
 * This should be rendered within the Router context.
 */
const InactivityMonitor: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Only enable the monitor if the user is authenticated
  useInactivityLogout(isAuthenticated);
  
  return null;
};

export default InactivityMonitor;
