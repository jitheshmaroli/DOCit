import React, { useState } from 'react';
import { showError } from '../utils/toastConfig';
import Modal from './common/Modal';
import { AlertTriangle } from 'lucide-react';

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

  const handleConfirm = () => {
    if (!cancellationReason.trim()) {
      showError('Please provide a cancellation reason.');
      return;
    }
    onConfirm(cancellationReason);
    setCancellationReason('');
    onClose();
  };

  const handleClose = () => {
    setCancellationReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancel Appointment"
      description={`Appointment #${appointmentId.slice(-6)}`}
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">
            Keep Appointment
          </button>
          <button onClick={handleConfirm} className="btn-danger">
            Confirm Cancellation
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle
            size={15}
            className="text-warning flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-amber-700">
            This action cannot be undone. Please provide a reason so we can
            improve our service.
          </p>
        </div>

        <div>
          <label className="label mb-1.5">
            Cancellation Reason <span className="text-error">*</span>
          </label>
          <textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Tell us why you're cancelling this appointment..."
            maxLength={maxLength}
            rows={3}
            className="input resize-none"
          />
          <p
            className={`text-xs mt-1 text-right ${cancellationReason.length >= maxLength * 0.9 ? 'text-warning' : 'text-text-muted'}`}
          >
            {cancellationReason.length}/{maxLength}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CancelAppointmentModal;
