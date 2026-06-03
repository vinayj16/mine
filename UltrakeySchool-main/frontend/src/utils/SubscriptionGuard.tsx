import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const hasActivePlan = (user: any): boolean => {
  if (!user) return false;
  
  // Superadmins might not need a plan, or they always have access
  if (user.role === 'superadmin') return true;

  // For institutions, check the subscription
  const planName = user.institutionData?.subscription?.planName;
  const endDate = user.institutionData?.subscription?.endDate;
  
  if (!planName || planName.toLowerCase() === 'free') {
    return false;
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (end < new Date()) {
      return false; // Subscription expired
    }
  }

  return true;
};

interface SubscriptionGuardProps {
  children?: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user } = useAuthStore() as any;
  
  if (!hasActivePlan(user)) {
    return <Navigate to="/dashboard/institute-admin/subscription" replace />;
  }
  
  return <>{children || <Outlet />}</>;
};

export default SubscriptionGuard;
