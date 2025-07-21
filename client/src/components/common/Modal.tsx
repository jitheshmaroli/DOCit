import React, { useCallback, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal = React.memo(
  ({ isOpen, onClose, title, children, footer }: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    if (!isOpen) return null;

    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div
          ref={modalRef}
          className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 w-full max-w-md max-h-[calc(100vh-8rem)] overflow-y-auto"
        >
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <div className="mb-4">{children}</div>
          <div className="flex justify-end space-x-2">
            {footer || (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default Modal;
