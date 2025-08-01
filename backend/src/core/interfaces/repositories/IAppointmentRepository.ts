import { Appointment } from '../../entities/Appointment';
import { Prescription } from '../../entities/Prescription';
import { QueryParams } from '../../../types/authTypes';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(appointmentId: string): Promise<Appointment | null>;
  deleteById(appointmentId: string): Promise<void>;
  findUpcomingAppointments(start: Date, end: Date): Promise<Appointment[]>;
  findByDoctorAndSlot(doctorId: string, date: Date, startTime: string, endTime: string): Promise<Appointment | null>;
  countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number>;
  countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number>;
  update(appointmentId: string, updates: Partial<Appointment>): Promise<void>;
  findByPatient(patientId: string): Promise<Appointment[]>;
  findByPatientAndDoctorWithQuery(
    patientId: string,
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }>;
  findByDoctor(doctorId: string): Promise<Appointment[]>;
  findByDoctorWithQuery(doctorId: string, params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
  completeAppointmentAndCreatePrescription(
    appointmentId: string,
    prescription: Omit<Prescription, '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment>;
}
