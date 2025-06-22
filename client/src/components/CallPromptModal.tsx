// src/components/CallPromptModal.tsx
import React from 'react';
import { SocketManager } from '../services/SocketManager';

interface CallPromptModalProps {
  isOpen: boolean;
  doctorName: string;
  appointmentId: string;
  callerId: string; // Doctor's user ID
  onAccept: () => void;
  onDecline: () => void;
}

const CallPromptModal: React.FC<CallPromptModalProps> = ({
  isOpen,
  doctorName,
  appointmentId,
  callerId,
  onAccept,
  onDecline,
}) => {
  const socketManager = SocketManager.getInstance();

  const handleDecline = () => {
    socketManager.emit('endCall', {
      appointmentId,
      to: callerId,
      from: socketManager.getSocket()!.id!, // Patient's socket ID
    });
    onDecline();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Incoming Call from Dr. {doctorName}
        </h3>
        <p className="text-gray-300 mb-6">Would you like to accept the call?</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onAccept}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300"
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallPromptModal;
