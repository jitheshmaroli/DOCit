import { AppointmentStatus } from '../../application/dtos/AppointmentDTOs';
import { Doctor } from './Doctor';
import { Patient } from './Patient';
import { Prescription } from './Prescription';
import { SubscriptionPlan } from './SubscriptionPlan';

export interface Appointment {
  _id?: string;
  patientId?: string;
  doctorId?: string;
  planId?: string;
  slotId?: string;
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

export interface ExtendedAppointment extends Appointment {
  patient: Patient;
  doctor: Doctor;
  plan: SubscriptionPlan;
  prescription: Prescription;
}
