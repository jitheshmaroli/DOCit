import mongoose, { Schema } from 'mongoose';
import { Patient } from '../../../core/entities/Patient';

const PatientSchema = new Schema<Patient>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    phone: { type: String },
    age: { type: String },
    isSubscribed: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    address: { type: String },
    pincode: { type: String },
    profilePicture: { type: String },
    profilePicturePublicId: { type: String },
    refreshToken: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    googleId: { type: String, unique: true, sparse: true },
    lastSeen: { type: Date },
    isOnline: { type: Boolean, default: false },
    isOtpVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PatientModel = mongoose.model<Patient>('Patient', PatientSchema);
