import { QueryParams } from '../../../types/authTypes';
import { Appointment } from '../../entities/Appointment';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  deleteById(id: string): Promise<void>;
  findByDoctorAndSlot(doctorId: string, date: Date, startTime: string, endTime: string): Promise<Appointment | null>;
  countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number>;
  countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number>;
  update(id: string, updates: Partial<Appointment>): Promise<void>;
  findByPatient(patientId: string): Promise<Appointment[]>;
  findByPatientAndDoctor(patientId: string, doctorId: string): Promise<Appointment[]>;
  findByDoctor(doctorId: string): Promise<Appointment[]>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
}
