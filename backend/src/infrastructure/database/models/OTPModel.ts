import mongoose, { Schema } from 'mongoose';
import { OTP } from '../../../core/entities/OTP';

const OTPSchema = new Schema<OTP>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

export const OTPModel = mongoose.model<OTP>('OTP', OTPSchema);
