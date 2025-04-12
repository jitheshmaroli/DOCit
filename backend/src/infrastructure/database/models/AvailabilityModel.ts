import mongoose, { Schema } from 'mongoose';
import { Availability } from '../../../core/entities/Availability';

const AvailabilitySchema = new Schema<Availability>(
  {
    doctorId: { type: String, required: true, ref: 'Doctor' },
    date: { type: Date, required: true },
    timeSlots: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

AvailabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const AvailabilityModel = mongoose.model<Availability>(
  'Availability',
  AvailabilitySchema
);
