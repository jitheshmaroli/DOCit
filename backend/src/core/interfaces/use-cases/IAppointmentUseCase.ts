import { Appointment } from '../../entities/Appointment';
import { Prescription } from '../../entities/Prescription';
import { QueryParams } from '../../../types/authTypes';

export interface IAppointmentUseCase {
  bookAppointment(
    patientId: string,
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
    isFreeBooking: boolean
  ): Promise<Appointment>;
  cancelAppointment(appointmentId: string, patientId: string, cancellationReason?: string): Promise<void>;
  adminCancelAppointment(appointmentId: string): Promise<void>;
  completeAppointment(
    doctorId: string,
    appointmentId: string,
    prescription: Omit<Prescription, '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment>;
  getAllAppointments(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
  getDoctorAppointments(doctorId: string, params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
  getDoctorAndPatientAppointmentsWithQuery(
    doctorId: string,
    patientId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }>;
  getPatientAppointments(
    patientId: string,
    queryParams: QueryParams
  ): Promise<{ appointments: Appointment[]; totalItems: number }>;
  getSingleAppointment(doctorId: string, appointmentId: string): Promise<Appointment>;
  getPatientAppointmentsForDoctor(
    patientId: string,
    doctorId: string,
    queryParams: QueryParams
  ): Promise<{ appointments: Appointment[]; totalItems: number }>;
  getAppointmentById(appointmentId: string): Promise<Appointment>;
  checkFreeBooking(patientId: string, doctorId: string): Promise<boolean>;
}
