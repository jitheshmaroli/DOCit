import React from 'react';
import { Download, Pill } from 'lucide-react';
import Modal from './common/Modal';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    notes?: string;
    pdfUrl?: string;
  };
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescription,
}) => {
  return (
    <Modal
      isOpen={isOpen && !!prescription}
      onClose={onClose}
      title="Prescription Details"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {prescription?.pdfUrl ? (
            <a
              href={prescription.pdfUrl}
              download="prescription.pdf"
              className="btn-primary text-sm"
            >
              <Download size={14} /> Download PDF
            </a>
          ) : (
            <span />
          )}
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      }
    >
      {prescription && (
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Medications
          </h4>
          <div className="space-y-3">
            {prescription.medications.map((med, i) => (
              <div key={i} className="card p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Pill size={14} className="text-primary-500" />
                  <span className="font-semibold text-text-primary">
                    {med.name}
                  </span>
                  <span className="badge badge-primary ml-auto">
                    {med.dosage}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-text-muted text-xs">Frequency</span>
                    <p className="text-text-secondary font-medium">
                      {med.frequency}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted text-xs">Duration</span>
                    <p className="text-text-secondary font-medium">
                      {med.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {prescription.notes && (
            <div className="p-3.5 bg-surface-muted rounded-xl border border-surface-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Notes
              </p>
              <p className="text-sm text-text-secondary">
                {prescription.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PrescriptionModal;
