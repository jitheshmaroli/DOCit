import React, { useState } from 'react';
import { toast } from 'react-toastify'; // Import toast

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointmentId: string;
}

const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointmentId,
}) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const maxLength = 200;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason.', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      }); // Use toast instead of alert
      return;
    }
    onConfirm(cancellationReason);
    setCancellationReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Cancel Appointment
        </h2>
        <p className="text-gray-200 mb-4">
          Are you sure you want to cancel appointment #{appointmentId.slice(-6)}
          ? Please provide a reason for cancellation.
        </p>
        <textarea
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)}
          placeholder="Enter cancellation reason (max 200 characters)"
          maxLength={maxLength}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none h-24"
        />
        <p className="text-sm text-gray-300 mt-1">
          {cancellationReason.length}/{maxLength} characters
        </p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
          >
            Confirm Cancellation
          </button>
          <button
            onClick={() => {
              setCancellationReason('');
              onClose();
            }}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
