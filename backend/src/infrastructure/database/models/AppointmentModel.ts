import mongoose, { Schema } from 'mongoose';
import { Appointment } from '../../../core/entities/Appointment';
import { AppointmentStatus } from '../../../application/dtos/AppointmentDTOs';

const AppointmentSchema = new Schema<Appointment>(
  {
    patientId: { type: Schema.Types.ObjectId, required: true, ref: 'Patient' },
    doctorId: { type: Schema.Types.ObjectId, required: true, ref: 'Doctor' },
    patientSubscriptionId: { type: Schema.Types.ObjectId, ref: 'PatientSubscription' },
    date: { type: Date, required: true },
    slotId: { type: Schema.Types.ObjectId },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
    },
    isFreeBooking: { type: Boolean, default: false },
    bookingTime: { type: Date, default: Date.now },
    cancellationReason: { type: String, required: false },
    prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', required: false },
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
