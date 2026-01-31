import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/common';
import { MainLayout } from '@/components/layout';
import {
  LoginPage,
  RegisterPage,
  DashboardRedirect,
  RequesterDashboardPage,
  ProjectDetailPage,
  RaterDashboardPage,
  ProjectSessionsPage,
  RatingPage,
} from '@/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Dashboard redirect */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Requester routes */}
              <Route element={<MainLayout requiredRole="requester" />}>
                <Route path="/requester/dashboard" element={<RequesterDashboardPage />} />
                <Route path="/requester/projects/:id" element={<ProjectDetailPage />} />
              </Route>

              {/* Rater routes */}
              <Route element={<MainLayout requiredRole="rater" />}>
                <Route path="/rater/dashboard" element={<RaterDashboardPage />} />
              </Route>

              {/* Shared routes (both roles) */}
              <Route element={<MainLayout />}>
                <Route path="/projects/:id/rate" element={<ProjectSessionsPage />} />
                <Route path="/sessions/:id/rate" element={<RatingPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
