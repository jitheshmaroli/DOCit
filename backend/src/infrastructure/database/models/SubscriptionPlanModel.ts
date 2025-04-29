import mongoose, { Schema } from 'mongoose';
import { SubscriptionPlan } from '../../../core/entities/SubscriptionPlan';

const SubscriptionPlanSchema = new Schema<SubscriptionPlan>(
  {
    doctorId: { type: String, required: true, ref: 'Doctor' },
    name: { type: String, required: true },
    description: { type: String, required: true },
    appointmentCost: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

SubscriptionPlanSchema.index({ doctorId: 1 });
SubscriptionPlanSchema.index({ status: 1 });

export const SubscriptionPlanModel = mongoose.model<SubscriptionPlan>(
  'SubscriptionPlan',
  SubscriptionPlanSchema
);