import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BackButtonProps {
  defaultPath?: string;
  defaultLabel?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  defaultPath = '/doctor',
  defaultLabel = 'Back to Dashboard',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getBackConfig = () => {
    const from = location.state?.from;

    switch (from) {
      case 'plans':
        return { path: '/doctor/plans', label: 'Back to Plans' };
      case 'appointments':
        return { path: '/doctor/appointments', label: 'Back to Appointments' };
      case 'patients':
        return { path: '/doctor/patients', label: 'Back to Patients List' };
      default:
        return {
          path: defaultPath || '/doctor/dashboard',
          label: defaultLabel || 'Back',
        };
    }
  };

  const { path, label } = getBackConfig();

  return (
    <button
      onClick={() => navigate(path)}
      className="mb-4 text-white hover:text-blue-300 flex items-center"
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {label}
    </button>
  );
};

export default BackButton;