import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Logo from './Logo';
import useAuth from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import { useSocket } from '../../hooks/useSocket';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { logout } = useAuth();
  const { connect, isConnected } = useSocket();

  const isAuthenticated = !!user;

  const patientNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Find Doctor', path: '/patient/find-doctor' },
    { name: 'Subscriptions', path: '/patient/subscriptions' },
    { name: 'Messages', path: '/patient/messages' },
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

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/');
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLogoutModalOpen(false);
    }
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
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
      <header className="bg-[#320A6B]/70 backdrop-blur-lg py-4 px-6 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Logo />
          <div className="animate-pulse h-6 w-24 bg-[#78B9B5]/20 rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-gradient-to-r from-[#320A6B] to-[#065084] py-4 px-6 sticky top-0 z-50 border-b border-[#78B9B5]/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[#B7DEE6] hover:text-[#78B9B5] transition-colors ${
                    location.pathname === item.path
                      ? 'text-[#78B9B5] font-medium'
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
                    className={`text-[#B7DEE6] hover:text-[#78B9B5] transition-colors ${
                      location.pathname === dashboardPath
                        ? 'text-[#78B9B5] font-medium'
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
                        className="text-[#B7DEE6] hover:text-[#78B9B5] transition-colors"
                      >
                        Login
                      </Link>
                    )}
                    {location.pathname !== '/signup' && (
                      <Link
                        to="/signup"
                        className="text-[#B7DEE6] hover:text-[#78B9B5] transition-colors"
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
                      <Link to="/patient/profile" className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#78B9B5]/50 flex items-center justify-center text-white font-medium overflow-hidden">
                          {user?.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : user?.name ? (
                            user.name.charAt(0).toUpperCase()
                          ) : (
                            'U'
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={handleLogoutClick}
                        className="ml-2 text-[#B7DEE6] hover:text-[#78B9B5] transition-colors"
                        aria-label="Logout"
                      >
                        <LogOut className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-[#B7DEE6] hover:text-[#78B9B5] focus:outline-none"
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
          <div className="md:hidden bg-gradient-to-r from-[#320A6B]/80 to-[#065084]/80 py-2 border-t border-[#78B9B5]/20">
            <nav className="flex flex-col space-y-2 px-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`py-2 px-4 text-[#B7DEE6] hover:text-[#78B9B5] rounded transition-colors ${
                    location.pathname === item.path
                      ? 'text-[#78B9B5] font-medium bg-[#78B9B5]/10'
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
                    className={`py-2 px-4 text-[#B7DEE6] hover:text-[#78B9B5] rounded transition-colors ${
                      location.pathname === dashboardPath
                        ? 'text-[#78B9B5] font-medium bg-[#78B9B5]/10'
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
                        className="py-2 px-4 text-[#B7DEE6] hover:text-[#78B9B5] rounded transition-colors"
                      >
                        Login
                      </Link>
                    )}
                    {location.pathname !== '/signup' && (
                      <Link
                        to="/signup"
                        className="py-2 px-4 text-[#B7DEE6] hover:text-[#78B9B5] rounded transition-colors"
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
                    {isPatientRoute && (
                      <Link
                        to="/patient/profile"
                        className={`py-2 px-4 text-[#B7DEE6] hover:text-[#78B9B5] rounded transition-colors ${
                          location.pathname === '/patient/profile'
                            ? 'text-[#78B9B5] font-medium bg-[#78B9B5]/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-[#78B9B5]/50 flex items-center justify-center text-white font-medium mr-2 overflow-hidden">
                            {user?.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : user?.name ? (
                              user.name.charAt(0).toUpperCase()
                            ) : (
                              'U'
                            )}
                          </div>
                          Profile
                        </div>
                      </Link>
                    )}
                    <div className="py-2 px-4">
                      <NotificationDropdown userId={user?._id} />
                    </div>
                    {isPatientRoute && (
                      <button
                        onClick={handleLogoutClick}
                        className="py-2 px-4 text-left text-[#B7DEE6] hover:text-[#78B9B5] rounded transition-colors flex items-center"
                        aria-label="Logout"
                      >
                        <LogOut className="w-6 h-6 mr-2" />
                        Logout
                      </button>
                    )}
                  </>
                )}
            </nav>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-[#320A6B] to-[#065084] p-6 rounded-lg shadow-lg max-w-sm w-full border border-[#78B9B5]/20">
            <h2 className="text-[#B7DEE6] text-lg font-medium mb-4">
              Are you sure you want to logout?
            </h2>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 text-[#B7DEE6] hover:text-[#78B9B5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-[#78B9B5] text-white rounded hover:bg-[#78B9B5]/80 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
