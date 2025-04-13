import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '../../types/authTypes';
import { RootState } from '../../redux/store';

interface ProtectedRouteProps {
  roles?: UserRole[];
  redirectUnauthenticated?: string;
  redirectUnauthorized?: string;
}

const ProtectedRoute = ({
  roles,
  redirectUnauthenticated = '/login',
  redirectUnauthorized = '/unauthorized',
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={redirectUnauthenticated}
        state={{ from: location }}
        replace
      />
    );
  }
  console.log('user', user);
  console.log('roles', roles);

  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate to={redirectUnauthorized} state={{ from: location }} replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
