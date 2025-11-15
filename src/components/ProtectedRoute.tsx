import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from './Navigate';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'BUSINESS_OWNER' | 'STAFF' | 'CUSTOMER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
