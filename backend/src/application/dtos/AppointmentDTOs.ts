import { QueryParams } from '../../types/authTypes';

export interface AppointmentPatientDTO {
  _id: string;
  name?: string;
  profilePicture?: string;
}

export interface AppointmentDoctorDTO {
  _id: string;
  name: string;
  profilePicture?: string;
  speciality?: string;
  qualifications?: string[];
  gender?: 'Male' | 'Female' | 'Other';
}

export interface BookAppointmentRequestDTO {
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isFreeBooking: boolean;
}

export interface BookAppointmentResponseDTO {
  appointment: AppointmentDTO;
  message: string;
}

export interface CancelAppointmentRequestDTO {
  appointmentId: string;
  patientId?: string;
  doctorId?: string;
  cancellationReason?: string;
}

export interface CancelAppointmentResponseDTO {
  message: string;
}

export interface AdminCancelAppointmentResponseDTO {
  message: string;
}

export interface CompleteAppointmentRequestDTO {
  doctorId: string;
  appointmentId: string;
  prescription: PrescriptionDTO;
}

export interface CompleteAppointmentResponseDTO {
  appointment: AppointmentDTO;
  message: string;
}

export interface GetAppointmentsResponseDTO {
  data: AppointmentDTO[];
  totalItems: number;
}

export interface GetPatientAppointmentsResponseDTO {
  appointments: AppointmentDTO[];
  totalItems: number;
}

export interface GetDoctorAndPatientAppointmentsRequestDTO {
  doctorId: string;
  patientId: string;
  queryParams: QueryParams;
}

export interface GetPatientAppointmentsForDoctorRequestDTO {
  patientId: string;
  doctorId: string;
  queryParams: QueryParams;
}

export interface CheckFreeBookingRequestDTO {
  patientId: string;
  doctorId: string;
}

export interface AppointmentDTO {
  _id?: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  isFreeBooking: boolean;
  bookingTime: string;
  patientSubscriptionId?: string;
  cancellationReason?: string;
  prescriptionId?: string;
  prescription?: PrescriptionDTO;
  hasReview?: boolean;
  patientName?: string;
  doctorName?: string;
}
export enum AppointmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PrescriptionDTO {
  _id?: string;
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
  pdfUrl?: string;
}
