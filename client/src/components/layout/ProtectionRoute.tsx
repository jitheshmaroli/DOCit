import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '../../types/authTypes';
import { RootState } from '../../redux/store';
import { useEffect } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { checkAuthThunk } from '../../redux/thunks/authThunks';

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
  const dispatch = useAppDispatch();
  const { user, loading, initialAuthCheckComplete } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!initialAuthCheckComplete) {
      dispatch(checkAuthThunk(roles ? roles[0] : undefined));
    }
  }, [dispatch, initialAuthCheckComplete, roles]);

  if (!initialAuthCheckComplete || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log('Redirecting to login: No user found');
    return (
      <Navigate
        to={redirectUnauthenticated}
        state={{ from: location }}
        replace
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    console.log('Redirecting to unauthorized: Role not allowed', user.role);
    return (
      <Navigate to={redirectUnauthorized} state={{ from: location }} replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;