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
    speciality: { type: String }, 
    age: { type: String }, 
    gender: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    profilePicture: { type: String },
    refreshToken: { type: String },
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const DoctorModel = mongoose.model<Doctor>('Doctor', DoctorSchema);
