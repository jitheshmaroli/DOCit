import mongoose, { Schema } from 'mongoose';
import { Doctor } from '../../../core/entities/Doctor';

const ExperienceSchema = new Schema({
  hospitalName: { type: String, required: true },
  department: { type: String, required: true },
  years: { type: Number, required: true, min: 0 },
});

const DoctorSchema = new Schema<Doctor>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    phone: { type: String },
    qualifications: { type: [String] },
    licenseNumber: { type: String },
    location: { type: String },
    speciality: { type: Schema.Types.ObjectId, ref: 'Speciality' },
    experiences: [ExperienceSchema],
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
    reviewIds: { type: [String] },
    isOtpVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DoctorModel = mongoose.model<Doctor>('Doctor', DoctorSchema);
