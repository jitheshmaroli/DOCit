import React, { useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  description?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const Modal = React.memo(
  ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    description,
  }: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => onClose(), [onClose]);

    // Close on Escape key
    useEffect(() => {
      if (!isOpen) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleClose();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, handleClose]);

    // Lock body scroll while open
    useEffect(() => {
      if (isOpen) document.body.style.overflow = 'hidden';
      else document.body.style.overflow = '';
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          ref={modalRef}
          className={`bg-white rounded-2xl shadow-modal border border-surface-border w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-scale-in`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-surface-border flex-shrink-0">
            <div>
              <h3
                id="modal-title"
                className="font-display font-bold text-text-primary text-lg leading-tight"
              >
                {title}
              </h3>
              {description && (
                <p className="text-sm text-text-secondary mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="ml-4 flex-shrink-0 p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-surface-border bg-surface-bg rounded-b-2xl flex-shrink-0 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';
export default Modal;
