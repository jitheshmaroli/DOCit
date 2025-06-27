import mongoose, { Schema } from 'mongoose';
import { Prescription } from '../../../core/entities/Prescription';

const PrescriptionSchema = new Schema<Prescription>(
  {
    appointmentId: { type: String, required: true, ref: 'Appointment' },
    patientId: { type: String, required: true, ref: 'Patient' },
    doctorId: { type: String, required: true, ref: 'Doctor' },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    notes: { type: String },
  },
  { timestamps: true }
);

export const PrescriptionModel = mongoose.model<Prescription>('Prescription', PrescriptionSchema);
