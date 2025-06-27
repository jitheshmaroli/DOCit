/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Appointment } from '../types/authTypes';
import { useAppDispatch } from '../redux/hooks';
import { completeAppointmentThunk } from '../redux/thunks/doctorThunk';
import Modal from './common/Modal';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface FormErrors {
  medications: Array<{ [key in keyof Medication]?: string }>;
  notes?: string;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const dispatch = useAppDispatch();
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({ medications: [{}] });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { medications: medications.map(() => ({})) };
    let isValid = true;

    medications.forEach((med, index) => {
      if (!med.name.trim()) {
        newErrors.medications[index].name = 'Medication name is required';
        isValid = false;
      }
      if (!med.dosage.trim()) {
        newErrors.medications[index].dosage = 'Dosage is required';
        isValid = false;
      }
      if (!med.frequency.trim()) {
        newErrors.medications[index].frequency = 'Frequency is required';
        isValid = false;
      }
      if (!med.duration.trim()) {
        newErrors.medications[index].duration = 'Duration is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '' },
    ]);
    setErrors((prev) => ({ ...prev, medications: [...prev.medications, {}] }));
  };

  const handleMedicationChange = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);

    // Clear error for the changed field
    setErrors((prev) => {
      const newErrors = { ...prev, medications: [...prev.medications] };
      newErrors.medications[index] = {
        ...newErrors.medications[index],
        [field]: undefined,
      };
      return newErrors;
    });
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
    setErrors((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const prescription = { medications, notes: notes.trim() || undefined };
      await dispatch(
        completeAppointmentThunk({
          appointmentId: appointment._id,
          prescription,
        })
      ).unwrap();
      toast.success('Appointment completed and prescription created');
      onClose();
    } catch (error: any) {
      toast.error(error || 'Failed to complete appointment');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Prescription for ${appointment.patientId?.name || 'Patient'}`}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
          >
            Submit
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Medications</h3>
          {medications.map((medication, index) => (
            <div
              key={index}
              className="flex flex-col space-y-3 border-b border-white/20 pb-4 mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Medication Name (e.g., Ibuprofen)"
                    className={`w-full p-2 bg-white/10 border ${
                      errors.medications[index]?.name
                        ? 'border-red-500'
                        : 'border-white/20'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    value={medication.name}
                    onChange={(e) =>
                      handleMedicationChange(index, 'name', e.target.value)
                    }
                  />
                  {errors.medications[index]?.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.medications[index].name}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Dosage (e.g., 200mg)"
                    className={`w-full p-2 bg-white/10 border ${
                      errors.medications[index]?.dosage
                        ? 'border-red-500'
                        : 'border-white/20'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    value={medication.dosage}
                    onChange={(e) =>
                      handleMedicationChange(index, 'dosage', e.target.value)
                    }
                  />
                  {errors.medications[index]?.dosage && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.medications[index].dosage}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Frequency (e.g., Twice daily)"
                    className={`w-full p-2 bg-white/10 border ${
                      errors.medications[index]?.frequency
                        ? 'border-red-500'
                        : 'border-white/20'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    value={medication.frequency}
                    onChange={(e) =>
                      handleMedicationChange(index, 'frequency', e.target.value)
                    }
                  />
                  {errors.medications[index]?.frequency && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.medications[index].frequency}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Duration (e.g., 7 days)"
                    className={`w-full p-2 bg-white/10 border ${
                      errors.medications[index]?.duration
                        ? 'border-red-500'
                        : 'border-white/20'
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    value={medication.duration}
                    onChange={(e) =>
                      handleMedicationChange(index, 'duration', e.target.value)
                    }
                  />
                  {errors.medications[index]?.duration && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.medications[index].duration}
                    </p>
                  )}
                </div>
              </div>
              {medications.length > 1 && (
                <button
                  onClick={() => handleRemoveMedication(index)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove Medication
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddMedication}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
          >
            Add Another Medication
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Additional Notes
          </h3>
          <textarea
            placeholder="Enter any additional notes or instructions"
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default PrescriptionModal;
