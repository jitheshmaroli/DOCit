import mongoose, { Schema } from 'mongoose';
import { PatientSubscription } from '../../../core/entities/PatientSubscription';

const PatientSubscriptionSchema = new Schema<PatientSubscription>(
  {
    patientId: { type: String, required: true, ref: 'Patient' },
    planId: { type: String, required: true, ref: 'SubscriptionPlan' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const PatientSubscriptionModel = mongoose.model<PatientSubscription>(
  'PatientSubscription',
  PatientSubscriptionSchema
);
