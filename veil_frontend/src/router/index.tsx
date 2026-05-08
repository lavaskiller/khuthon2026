import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import type { UserRole } from '@/types';

/** Redirects unauthenticated users to /login */
export function RequireAuth({ role }: { role?: UserRole }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

/** Redirects authenticated users away from auth pages */
export function RequireGuest() {
  const { user } = useAuth();

  if (!user) return <Outlet />;

  if (user.role === 'consumer') {
    return <Navigate to={user.onboardingCompleted ? '/consumer/home' : '/consumer/onboarding'} replace />;
  }
  if (user.role === 'creator') return <Navigate to="/creator/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/review" replace />;
  return <Outlet />;
}
