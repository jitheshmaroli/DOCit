import mongoose, { Schema } from 'mongoose';
import { SubscriptionPlan } from '../../../core/entities/SubscriptionPlan';

const SubscriptionPlanSchema = new Schema<SubscriptionPlan>(
  {
    doctorId: { type: String, required: true, ref: 'Doctor' },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 100 },
    validityDays: { type: Number, required: true, min: 1 },
    appointmentCount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const SubscriptionPlanModel = mongoose.model<SubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
