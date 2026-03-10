import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  LogOut,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Stethoscope,
  Tag,
  CalendarDays,
  BriefcaseMedical,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import DashboardSidebar, {
  SidebarNavItem,
} from '../components/common/DashboardSidebar';
import { useAppSelector } from '../redux/hooks';
import useAuth from '../hooks/useAuth';
import ROUTES from '../constants/routeConstants';

const adminNavItems: SidebarNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    route: ROUTES.ADMIN.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    key: 'manage-patients',
    label: 'Manage Patients',
    route: ROUTES.ADMIN.MANAGE_PATIENTS,
    icon: Users,
  },
  {
    key: 'manage-doctors',
    label: 'Manage Doctors',
    route: ROUTES.ADMIN.MANAGE_DOCTORS,
    icon: Stethoscope,
  },
  {
    key: 'specialities',
    label: 'Specialities',
    route: ROUTES.ADMIN.SPECIALITIES,
    icon: Tag,
  },
  {
    key: 'appointments',
    label: 'Appointments',
    route: ROUTES.ADMIN.APPOINTMENTS,
    icon: CalendarDays,
  },
  {
    key: 'plan-management',
    label: 'Plan Management',
    route: ROUTES.ADMIN.PLAN_MANAGEMENT,
    icon: BriefcaseMedical,
  },
];

const AdminLayout: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const activePage = location.pathname.split('/')[2];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <>
      <div className="min-h-screen flex flex-col bg-surface-bg">
        {/* Full-width Header */}
        <header className="h-16 bg-white border-b border-surface-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 pl-2 ml-1 border-l border-surface-border">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-text-primary leading-none">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Administrator</p>
              </div>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-red-50 transition-colors ml-1"
              aria-label="Logout"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Middle: sidebar + page content */}
        <div className="flex flex-1 min-h-0">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <aside
            className={`
              fixed top-16 bottom-0 left-0 z-50 w-64 bg-white border-r border-surface-border shadow-sidebar
              transform transition-transform duration-300 ease-in-out flex flex-col
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              md:relative md:top-auto md:bottom-auto md:translate-x-0 md:flex md:flex-shrink-0
            `}
          >
            <DashboardSidebar
              items={adminNavItems}
              activePage={activePage}
              onClose={() => setIsSidebarOpen(false)}
            />
          </aside>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </main>
        </div>

        {/* Full-width Footer */}
        <footer className="px-6 py-3 border-t border-surface-border bg-white flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-text-muted">
            © {currentYear} DOCit Admin System. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-xs text-text-muted hover:text-primary-600 transition-colors"
            >
              Support
            </a>
            <a
              href="#"
              className="text-xs text-text-muted hover:text-primary-600 transition-colors"
            >
              Privacy
            </a>
          </div>
        </footer>
      </div>

      {/* Logout modal */}
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

export default AdminLayout;
