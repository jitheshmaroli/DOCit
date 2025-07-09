import mongoose, { Schema } from 'mongoose';
import { Review } from '../../../core/entities/Review';

const ReviewSchema = new Schema<Review>(
  {
    patientId: { type: String, required: true, ref: 'Patient' },
    doctorId: { type: String, required: true, ref: 'Doctor' },
    appointmentId: { type: String, required: true, ref: 'Appointment' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: null },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model<Review>('Review', ReviewSchema);
