import React from 'react';
import Logo from '../components/common/Logo';
import Sidebar from '../components/layout/Sidebar';
import { Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const activePage = location.pathname.split('/')[2];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900">
      <header className="w-full h-14 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 md:px-7">
          <Logo />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage={activePage} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <footer className="w-full h-12 bg-white/10 backdrop-blur-lg border-t border-white/20">
        <div className="flex justify-end items-center h-full px-4 md:pr-12">
          <p className="text-gray-200 text-sm">
            © {currentYear} DOCit Admin System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
