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
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    isFreeBooking: { type: Boolean, default: false },
    bookingTime: { type: Date, default: Date.now },
    cancellationReason: { type: String, required: false },
    prescriptionId: { type: String, ref: 'Prescription', required: false },
    hasReview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppointmentSchema.index({
  'patientId.name': 'text',
  'doctorId.name': 'text',
});

AppointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1, endTime: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

export const AppointmentModel = mongoose.model<Appointment>('Appointment', AppointmentSchema);
