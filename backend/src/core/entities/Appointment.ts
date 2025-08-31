import { AppointmentStatus } from '../../application/dtos/AppointmentDTOs';

export interface Appointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  planId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  isFreeBooking: boolean;
  bookingTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
  reminderSent?: boolean;
  cancellationReason?: string;
  prescriptionId?: string;
  hasReview?: boolean;
}
