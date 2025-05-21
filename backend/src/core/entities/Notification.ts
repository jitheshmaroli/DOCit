export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PLAN_APPROVED = 'plan_approved',
  PLAN_REJECTED = 'plan_rejected',
  PLAN_SUBSCRIBED = 'plan_subscribed',
  DOCTOR_VERIFIED = 'doctor_verified',
}

export interface Notification {
  _id?: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead?: boolean;
  createdAt?: Date;
}
