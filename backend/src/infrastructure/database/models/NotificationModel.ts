import mongoose, { Schema } from 'mongoose';
import { Notification, NotificationType } from '../../../core/entities/Notification';

const NotificationSchema = new Schema<Notification>(
  {
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<Notification>('Notification', NotificationSchema);
