import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Logo from './Logo';
import useAuth from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import { useSocket } from '../../hooks/useSocket';
import { LogOut, Menu, X, ChevronRight, AlertTriangle } from 'lucide-react';
import ROUTES from '../../constants/routeConstants';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout } = useAuth();
  const { connect, isConnected } = useSocket();

  const isAuthenticated = !!user;

  const isLandingPage = location.pathname === '/';

  const patientNavItems = [
    { name: 'Find Doctor', path: ROUTES.PATIENT.FIND_DOCTOR },
    { name: 'Medical History', path: ROUTES.PATIENT.MEDICAL_HISTORY },
    { name: 'Subscriptions', path: ROUTES.PATIENT.SUBSCRIPTIONS },
    { name: 'Messages', path: ROUTES.PATIENT.MESSAGES },
  ];

  const landingNavItems = [{ name: 'Home', path: ROUTES.PUBLIC.LANDING }];

  let dashboardPath = '';
  if (user) {
    switch (user.role) {
      case 'admin':
        dashboardPath = ROUTES.ADMIN.DASHBOARD;
        break;
      case 'doctor':
        dashboardPath = ROUTES.DOCTOR.DASHBOARD;
        break;
      case 'patient':
        dashboardPath = ROUTES.PATIENT.FIND_DOCTOR;
        break;
      default:
        dashboardPath = ROUTES.PUBLIC.LOGIN;
        break;
    }
  }

  const isPatientRoute =
    isAuthenticated &&
    user?.role === 'patient' &&
    location.pathname.startsWith('/patient');
  const navItems = isPatientRoute ? patientNavItems : landingNavItems;

  // Track scroll for shadow on landing page
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user?._id && !isConnected) connect(user._id);
  }, [user?._id, isConnected, connect]);

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLogoutModalOpen(false);
    }
  };

  // On the landing page use a transparent-to-white header; on patient routes use solid white
  const headerBg = isLandingPage
    ? scrolled
      ? 'bg-white shadow-header'
      : 'bg-white/80 backdrop-blur-md'
    : 'bg-white shadow-header';

  if (loading) {
    return (
      <header
        className={`${headerBg} sticky top-0 z-50 transition-all duration-200`}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 md:px-6 h-16">
          <Logo />
          <div className="animate-pulse h-8 w-28 bg-surface-muted rounded-xl" />
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`${headerBg} sticky top-0 z-50 transition-all duration-200`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 md:px-6 h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  location.pathname === item.path
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {!isPatientRoute &&
              (isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    location.pathname === dashboardPath
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  }`}
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  {location.pathname !== '/login' && (
                    <Link to="/login" className="btn-ghost text-sm px-4 py-2">
                      Sign in
                    </Link>
                  )}
                  {location.pathname !== '/signup' && (
                    <Link
                      to="/signup"
                      className="btn-primary text-sm px-4 py-2"
                      state={{ role: 'patient' }}
                    >
                      Get started
                      <ChevronRight size={15} />
                    </Link>
                  )}
                </div>
              ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated &&
              (user?.role === 'patient' || user?.role === 'doctor') && (
                <>
                  <NotificationDropdown userId={user?._id} />

                  {isPatientRoute && (
                    <>
                      <Link
                        to={ROUTES.PATIENT.PROFILE}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-muted transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm overflow-hidden flex-shrink-0">
                          {user?.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors max-w-[100px] truncate">
                          {user?.name?.split(' ')[0]}
                        </span>
                      </Link>

                      <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-red-50 transition-colors"
                        aria-label="Logout"
                        title="Sign out"
                      >
                        <LogOut size={18} />
                      </button>
                    </>
                  )}
                </>
              )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-surface-border bg-white animate-fade-in">
            <nav className="flex flex-col px-4 py-3 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {!isPatientRoute &&
                (isAuthenticated ? (
                  <Link
                    to={dashboardPath}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === dashboardPath
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                    }`}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-surface-border">
                    {location.pathname !== ROUTES.PUBLIC.LOGIN && (
                      <Link
                        to={ROUTES.PUBLIC.LOGIN}
                        className="btn-secondary w-full justify-center py-2.5"
                      >
                        Sign in
                      </Link>
                    )}
                    {location.pathname !== ROUTES.PUBLIC.SIGNUP && (
                      <Link
                        to={ROUTES.PUBLIC.SIGNUP}
                        className="btn-primary w-full justify-center py-2.5"
                        state={{ role: 'patient' }}
                      >
                        Get started free
                      </Link>
                    )}
                  </div>
                ))}

              {isAuthenticated &&
                (user?.role === 'patient' || user?.role === 'doctor') && (
                  <div className="pt-2 mt-1 border-t border-surface-border space-y-1">
                    {isPatientRoute && (
                      <Link
                        to={ROUTES.PATIENT.PROFILE}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          location.pathname === '/patient/profile'
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs overflow-hidden">
                          {user?.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user?.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        My Profile
                      </Link>
                    )}

                    <div className="px-4 py-2">
                      <NotificationDropdown userId={user?._id} />
                    </div>

                    {isPatientRoute && (
                      <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    )}
                  </div>
                )}
            </nav>
          </div>
        )}
      </header>

      {/* Logout confirmation modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal border border-surface-border p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-error" />
              </div>
              <div>
                <h3 className="font-display font-bold text-text-primary mb-1">
                  Sign out?
                </h3>
                <p className="text-sm text-text-secondary">
                  You'll need to sign in again to access your account.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="btn-danger flex-1 py-2.5"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
