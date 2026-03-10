import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const PatientLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-surface-bg">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PatientLayout;
