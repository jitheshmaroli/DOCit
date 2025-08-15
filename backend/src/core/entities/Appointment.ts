import { Doctor } from './Doctor';
import { Patient } from './Patient';
import { Prescription } from './Prescription';

export interface Appointment {
  _id?: string;
  patientId: string | Patient;
  doctorId: string | Doctor;
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
  prescriptionId?: string | Prescription;
  hasReview?: boolean;
}
