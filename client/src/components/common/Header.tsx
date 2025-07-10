import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Logo from './Logo';
import useAuth from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import { useSocket } from '../../hooks/useSocket';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { connect, isConnected } = useSocket();

  const isAuthenticated = !!user;

  const patientNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Find Doctor', path: '/patient/find-doctor' },
    { name: 'Profile', path: '/patient/profile' },
  ];

  const landingNavItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ];

  let dashboardPath = '';
  if (user) {
    switch (user.role) {
      case 'admin':
        dashboardPath = '/admin/dashboard';
        break;
      case 'doctor':
        dashboardPath = '/doctor/dashboard';
        break;
      case 'patient':
        dashboardPath = '/patient/find-doctor';
        break;
      default:
        dashboardPath = '/login';
        break;
    }
  }

  const isPatientRoute =
    isAuthenticated &&
    user?.role === 'patient' &&
    location.pathname.startsWith('/patient');

  const navItems = isPatientRoute ? patientNavItems : landingNavItems;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user?._id && !isConnected) {
      connect(user._id);
    }
  }, [user?._id, isConnected, connect]);

  if (loading) {
    return (
      <header className="bg-white/10 backdrop-blur-lg py-4 px-6 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Logo />
          <div className="animate-pulse h-6 w-24 bg-gray-200/20 rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/10 backdrop-blur-lg py-4 px-6 sticky top-0 z-50 border-b border-white/20">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-gray-200 hover:text-purple-300 transition-colors ${
                  location.pathname === item.path
                    ? 'text-purple-300 font-medium'
                    : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {!isPatientRoute &&
              (isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className={`text-gray-200 hover:text-purple-300 transition-colors ${
                    location.pathname === dashboardPath
                      ? 'text-purple-300 font-medium'
                      : ''
                  }`}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  {location.pathname !== '/login' && (
                    <Link
                      to="/login"
                      className="text-gray-200 hover:text-purple-300 transition-colors"
                    >
                      Login
                    </Link>
                  )}
                  {location.pathname !== '/signup' && (
                    <Link
                      to="/signup"
                      className="text-gray-200 hover:text-purple-300 transition-colors"
                      state={{ role: 'patient' }}
                    >
                      Sign Up
                    </Link>
                  )}
                </>
              ))}
          </nav>
          {isAuthenticated &&
            (user?.role === 'patient' || user?.role === 'doctor') && (
              <div className="flex items-center space-x-4">
                <NotificationDropdown userId={user?._id} />
                {isPatientRoute && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-500/50 flex items-center justify-center text-white font-medium">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="ml-2 text-gray-200 hover:text-purple-300 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-gray-200 hover:text-purple-300 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg py-2 border-t border-white/20">
          <nav className="flex flex-col space-y-2 px-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-2 px-4 text-gray-200 hover:text-purple-300 rounded transition-colors ${
                  location.pathname === item.path
                    ? 'text-purple-300 font-medium bg-white/20'
                    : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {!isPatientRoute &&
              (isAuthenticated ? (
                <Link
                  to={dashboardPath}
                  className={`py-2 px-4 text-gray-200 hover:text-purple-300 rounded transition-colors ${
                    location.pathname === dashboardPath
                      ? 'text-purple-300 font-medium bg-white/20'
                      : ''
                  }`}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  {location.pathname !== '/login' && (
                    <Link
                      to="/login"
                      className="py-2 px-4 text-gray-200 hover:text-purple-300 rounded transition-colors"
                    >
                      Login
                    </Link>
                  )}
                  {location.pathname !== '/signup' && (
                    <Link
                      to="/signup"
                      className="py-2 px-4 text-gray-200 hover:text-purple-300 rounded transition-colors"
                      state={{ role: 'patient' }}
                    >
                      Sign Up
                    </Link>
                  )}
                </>
              ))}
            {isAuthenticated &&
              (user?.role === 'patient' || user?.role === 'doctor') && (
                <>
                  <div className="py-2 px-4">
                    <NotificationDropdown userId={user?._id} />
                  </div>
                  {isPatientRoute && (
                    <button
                      onClick={handleLogout}
                      className="py-2 px-4 text-left text-gray-200 hover:text-purple-300 rounded transition-colors"
                    >
                      Logout
                    </button>
                  )}
                </>
              )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
