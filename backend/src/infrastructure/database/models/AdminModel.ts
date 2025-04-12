import mongoose, { Schema } from 'mongoose';
import { Admin } from '../../../core/entities/Admin';

const AdminSchema = new Schema<Admin>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.model<Admin>('Admin', AdminSchema);
