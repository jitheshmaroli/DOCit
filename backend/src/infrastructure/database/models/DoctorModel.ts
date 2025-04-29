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
