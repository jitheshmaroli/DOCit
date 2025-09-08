import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

interface DoctorSidebarProps {
  activePage: string;
  onClose?: () => void;
}

const Sidebar: React.FC<DoctorSidebarProps> = ({ activePage, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    if (onClose) onClose();
  };

  const isActive = (page: string) =>
    activePage === page
      ? 'bg-purple-500/20 text-purple-300'
      : 'text-gray-200 hover:bg-white/30';

  return (
    <aside className="w-64 h-full bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col shadow-xl">
      <nav className="flex-1 pt-8 px-4 space-y-6">
        <Link
          to="/doctor/dashboard"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('dashboard')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">⌂</span>
          </div>
          <span className="text-[16px]">Dashboard</span>
        </Link>
        <Link
          to="/doctor/messages"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('messages')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">💬</span>
          </div>
          <span className="text-[16px]">Messages</span>
        </Link>
        <Link
          to="/doctor/appointments"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('appointments')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">📅</span>
          </div>
          <span className="text-[16px]">Appointments</span>
        </Link>
        <Link
          to="/doctor/patients"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('patients')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">👥</span>
          </div>
          <span className="text-[16px]">Patients</span>
        </Link>
        <Link
          to="/doctor/availability"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('availability')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">🕒</span>
          </div>
          <span className="text-[16px]">Availability</span>
        </Link>
        <Link
          to="/doctor/plans"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('plans')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">💸</span>
          </div>
          <span className="text-[16px]">Plans</span>
        </Link>
        <Link
          to="/doctor/profile"
          className={`flex items-center gap-3 py-2 px-4 ${isActive('profile')} transition-all duration-300`}
          onClick={onClose}
        >
          <div className="w-[30px] h-[30px] bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center rounded-md shadow-md">
            <span className="text-white">👤</span>
          </div>
          <span className="text-[16px]">Profile</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-white/20">
        <div className="w-full h-[60px] bg-white/20 backdrop-blur-lg flex items-center justify-center rounded-lg">
          <button
            onClick={handleLogout}
            className="text-[16px] text-red-300 hover:text-red-200 font-poppins transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
