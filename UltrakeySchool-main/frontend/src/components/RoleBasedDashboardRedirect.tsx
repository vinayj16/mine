import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const RoleBasedDashboardRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    console.log('[RoleBasedDashboardRedirect] userRole from localStorage:', role);
    setUserRole(role);
    setReady(true);
  }, []);
  
  useEffect(() => {
    if (ready && userRole) {
      const normalizedRole = userRole.toLowerCase().replace(/_/g, '').replace(/-/g, '');
      
      console.log('[RoleBasedDashboardRedirect] normalized role:', normalizedRole);
      
      let redirectPath = '/dashboard/main';
      
      switch (normalizedRole) {
        case 'institutionowner':
          redirectPath = '/dashboard/institution';
          break;
        case 'institutionadmin':
          redirectPath = '/dashboard/main';
          break;
        case 'admin':
          redirectPath = '/dashboard/admin';
          break;
        case 'superadmin':
          redirectPath = '/super-admin/dashboard';
          break;
        case 'principal':
          redirectPath = '/dashboard/principal';
          break;
        case 'teacher':
          redirectPath = '/dashboard/teacher';
          break;
        case 'student':
          redirectPath = '/dashboard/student';
          break;
        case 'parent':
          redirectPath = '/dashboard/parent';
          break;
        case 'staff':
        case 'staffmember':
          redirectPath = '/dashboard/staff';
          break;
        case 'accountant':
          redirectPath = '/dashboard/accountant';
          break;
        case 'hr':
          redirectPath = '/dashboard/hr';
          break;
        case 'librarian':
          redirectPath = '/dashboard/librarian';
          break;
        case 'transportmanager':
          redirectPath = '/transport';
          break;
        case 'hostelwarden':
          redirectPath = '/dashboard/hostel';
          break;
        case 'agent':
          redirectPath = '/agent';
          break;
        default:
          console.log('[RoleBasedDashboardRedirect] Unknown role:', userRole, 'normalized:', normalizedRole);
          redirectPath = '/dashboard/main';
      }
      
      console.log('[RoleBasedDashboardRedirect] Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [ready, userRole, navigate]);
  
  if (!ready) {
    return <div>Loading...</div>;
  }
  
  return <div>Redirecting...</div>;
};

export default RoleBasedDashboardRedirect;
