import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth';

export function RegisterPage() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    const redirectPath = user.role === 'requester' ? '/requester/dashboard' : '/rater/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <RegisterForm />;
}
