import mongoose, { Schema } from 'mongoose';
import { Review } from '../../../core/entities/Review';

const ReviewSchema = new Schema<Review>(
  {
    patientId: { type: String, ref: 'Patient', required: true },
    doctorId: { type: String, required: true },
    appointmentId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model<Review>('Review', ReviewSchema);
