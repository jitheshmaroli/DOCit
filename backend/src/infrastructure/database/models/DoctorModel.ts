import mongoose, { Schema } from 'mongoose';
import { Doctor } from '../../../core/entities/Doctor';

const DoctorSchema = new Schema<Doctor>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    phone: { type: String },
    qualifications: { type: [String] },
    licenseNumber: { type: String },
    location: { type: String },
    speciality: [{ type: Schema.Types.ObjectId, ref: 'Speciality' }],
    experience: { type: Number, min: 0 },
    allowFreeBooking: { type: Boolean, default: true },
    gender: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    profilePicture: { type: String },
    profilePicturePublicId: { type: String },
    refreshToken: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    lastSeen: { type: Date },
    isOnline: { type: Boolean, default: false },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewIds: { type: [String] },
  },
  { timestamps: true }
);

export const DoctorModel = mongoose.model<Doctor>('Doctor', DoctorSchema);
