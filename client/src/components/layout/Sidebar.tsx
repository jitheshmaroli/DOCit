import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

interface SidebarProps {
  activePage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
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
    <aside className="w-full md:w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col shadow-xl">
      <nav className="flex-1 py-4">
        <ul>
          <li>
            <Link
              to="/admin/dashboard"
              className={`flex items-center px-4 py-3 text-sm font-medium ${isActive('dashboard')} transition-all duration-300`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-patients"
              className={`flex items-center px-4 py-3 text-sm font-medium ${isActive('patients')} transition-all duration-300`}
            >
              <span className="mr-3">👥</span>
              Manage Patients
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-doctors"
              className={`flex items-center px-4 py-3 text-sm font-medium ${isActive('doctors')} transition-all duration-300`}
            >
              <span className="mr-3">👨‍⚕️</span>
              Manage Doctors
            </Link>
          </li>
          <li>
            <Link
              to="/admin/specialities"
              className={`flex items-center px-4 py-3 text-sm font-medium ${isActive('specialities')} transition-all duration-300`}
            >
              <span className="mr-3">🩺</span>
              Specialities
            </Link>
          </li>
          <li>
            <Link
              to="/admin/appointments"
              className={`flex items-center px-4 py-3 text-sm font-medium ${isActive('appointments')} transition-all duration-300`}
            >
              <span className="mr-3">📅</span>
              View Appointments
            </Link>
          </li>
          <li>
            <Link
              to="/admin/plan-management"
              className={`flex items-center px-4 py-3 text-sm font-medium ${isActive('plan-management')} transition-all duration-300`}
            >
              <span className="mr-3">💼</span>
              Plan Management
            </Link>
          </li>
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
