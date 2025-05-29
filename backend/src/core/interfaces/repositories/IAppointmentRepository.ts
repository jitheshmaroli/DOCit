import { Appointment } from '../../entities/Appointment';
import { QueryParams } from '../../../types/authTypes';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  deleteById(id: string): Promise<void>;
  findUpcomingAppointments(start: Date, end: Date): Promise<Appointment[]>;
  findByDoctorAndSlot(doctorId: string, date: Date, startTime: string, endTime: string): Promise<Appointment | null>;
  countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number>;
  countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number>;
  update(id: string, updates: Partial<Appointment>): Promise<void>;
  findByPatient(patientId: string): Promise<Appointment[]>;
  findByPatientAndDoctorWithQuery(
    patientId: string,
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }>;
  findByDoctor(doctorId: string): Promise<Appointment[]>;
  findByDoctorWithQuery(doctorId: string, params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
}
