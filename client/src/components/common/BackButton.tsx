import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
        return { path: '/doctor/patients', label: 'Back to Patients' };
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
      className="btn-ghost text-sm text-text-secondary hover:text-primary-600 inline-flex items-center gap-1.5"
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
};

export default BackButton;
