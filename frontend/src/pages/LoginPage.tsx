import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth';

export function LoginPage() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    const redirectPath = user.role === 'requester' ? '/requester/dashboard' : '/rater/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <LoginForm />;
}
