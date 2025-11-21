import React from 'react';
import { Download } from 'lucide-react';

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
  if (!isOpen || !prescription) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          Prescription Details
        </h3>
        <div className="space-y-4 mb-4">
          <h4 className="text-md font-medium text-white">Medications</h4>
          {prescription.medications.map((med, index) => (
            <div key={index} className="bg-white/5 p-3 rounded-lg">
              <p className="text-white">
                <strong>Name:</strong> {med.name}
              </p>
              <p className="text-white">
                <strong>Dosage:</strong> {med.dosage}
              </p>
              <p className="text-white">
                <strong>Frequency:</strong> {med.frequency}
              </p>
              <p className="text-white">
                <strong>Duration:</strong> {med.duration}
              </p>
            </div>
          ))}
          {prescription.notes && (
            <div>
              <h4 className="text-md font-medium text-white">Notes</h4>
              <p className="text-white">{prescription.notes}</p>
            </div>
          )}
        </div>
        {prescription.pdfUrl && (
          <a
            href={prescription.pdfUrl}
            download="prescription.pdf"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;
