import React, { useState } from 'react';
import Logo from '../components/common/Logo';
import Sidebar from '../components/layout/Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const activePage = location.pathname.split('/')[2];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900">
      {/* Sidebar */}
      <Sidebar activePage={activePage} isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="w-full h-14 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-sm flex items-center justify-between px-4 md:px-7">
          <div className="flex items-center">
            <button
              className="md:hidden text-white mr-4"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <Logo />
          </div>
        </header>

        {/* Main Content */}
        <main className="relative flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="w-full h-12 bg-white/10 backdrop-blur-lg border-t border-white/20">
          <div className="flex justify-end items-center h-full px-4 md:pr-12">
            <p className="text-gray-200 text-sm">
              © {currentYear} DOCit Admin System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
