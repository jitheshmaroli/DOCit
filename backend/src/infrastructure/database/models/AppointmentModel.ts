import mongoose, { Schema } from 'mongoose';
import { Appointment } from '../../../core/entities/Appointment';

const AppointmentSchema = new Schema<Appointment>(
  {
    patientId: { type: String, required: true, ref: 'Patient' },
    doctorId: { type: String, required: true, ref: 'Doctor' },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

AppointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

export const AppointmentModel = mongoose.model<Appointment>(
  'Appointment',
  AppointmentSchema
);
