export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  planId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  isFreeBooking: boolean;
  bookingTime: Date;
  patientName?: string;
  doctorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  reminderSent?: boolean;
  cancellationReason?: string;
  prescriptionId?: string;
  hasReview?: boolean;
}
