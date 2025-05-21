import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../pages/doctor/SideBar';
import Logo from '../components/common/Logo';
import NotificationDropdown from '../components/common/NotificationDropdown';
import { useAppSelector } from '../redux/hooks';

const DoctorLayout: React.FC = () => {
  const activePage = location.pathname.split('/')[2];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900">
      <header className="w-full h-20 bg-white/10 backdrop-blur-lg border-b border-white/20 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown userId={user?._id} />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-64 transform
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
          `}
        >
          <Sidebar
            activePage={activePage}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <footer className="w-full h-12 bg-white/10 backdrop-blur-lg border-t border-white/20 shadow-sm">
        <div className="flex justify-between items-center h-full px-4 md:px-6">
          <p className="text-gray-200 text-sm font-poppins">
            © {currentYear} DOCit Doctor Portal
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-gray-200 text-sm hover:text-purple-300 transition-colors"
            >
              Support
            </a>
            <a
              href="#"
              className="text-gray-200 text-sm hover:text-purple-300 transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorLayout;
