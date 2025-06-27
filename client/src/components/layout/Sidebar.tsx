import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { X } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, isOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (page: string) =>
    activePage === page
      ? 'bg-purple-500/20 text-purple-300'
      : 'text-gray-200 hover:bg-white/30';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col shadow-xl transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:w-64`}
    >
      <div className="flex items-center justify-between p-4 md:p-0 md:pt-4">
        <h2 className="text-lg font-semibold text-white hidden md:block">
          Admin Menu
        </h2>
        <button
          className="md:hidden text-white"
          onClick={() => document.dispatchEvent(new Event('closeSidebar'))}
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 py-4">
        <ul>
          {[
            { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
            {
              to: '/admin/manage-patients',
              label: 'Manage Patients',
              icon: '👥',
            },
            {
              to: '/admin/manage-doctors',
              label: 'Manage Doctors',
              icon: '👨‍⚕️',
            },
            { to: '/admin/specialities', label: 'Specialities', icon: '🩺' },
            {
              to: '/admin/appointments',
              label: 'View Appointments',
              icon: '📅',
            },
            {
              to: '/admin/plan-management',
              label: 'Plan Management',
              icon: '💼',
            },
          ].map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center px-4 py-3 text-sm font-medium ${isActive(item.to.split('/')[2])} transition-all duration-300`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-white/20 flex items-center">
        <div>
          <p className="text-sm font-medium text-white">ADMIN</p>
          <button
            onClick={handleLogout}
            className="text-xs text-red-300 hover:text-red-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
