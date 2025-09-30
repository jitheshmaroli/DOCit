import mongoose, { Schema } from 'mongoose';
import { PatientSubscription } from '../../../core/entities/PatientSubscription';

const PatientSubscriptionSchema = new Schema<PatientSubscription>(
  {
    patientId: { type: Schema.Types.ObjectId, required: true, ref: 'Patient' },
    planId: { type: Schema.Types.ObjectId, required: true, ref: 'SubscriptionPlan' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    price: { type: Number, required: true, min: 100 },
    appointmentsUsed: { type: Number, default: 0, min: 0 },
    appointmentsLeft: { type: Number, required: true, min: 0 },
    stripePaymentId: { type: String, unique: true, sparse: true },
    remainingDays: { type: Number },
    cancellationReason: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

export const PatientSubscriptionModel = mongoose.model<PatientSubscription>(
  'PatientSubscription',
  PatientSubscriptionSchema
);
