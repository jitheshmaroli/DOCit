import mongoose, { Schema } from 'mongoose';
import { Availability, TimeSlot } from '../../../core/entities/Availability';

const TimeSlotSchema = new Schema<TimeSlot>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
});

const AvailabilitySchema = new Schema<Availability>(
  {
    doctorId: { type: String, required: true, ref: 'Doctor' },
    date: { type: Date, required: true },
    timeSlots: [TimeSlotSchema],
  },
  { timestamps: true }
);

AvailabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const AvailabilityModel = mongoose.model<Availability>(
  'Availability',
  AvailabilitySchema
);
