import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/common';

export function DashboardRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const redirectPath = user?.role === 'requester' ? '/requester/dashboard' : '/rater/dashboard';
  return <Navigate to={redirectPath} replace />;
}
