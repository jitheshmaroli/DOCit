import { Appointment } from '../../entities/Appointment';
import { Prescription } from '../../entities/Prescription';
import { QueryParams } from '../../../types/authTypes';
import { IBaseRepository } from './IBaseRepository';

export interface IAppointmentRepository extends IBaseRepository<Appointment> {
  findByIdPopulated(appointmentId: string): Promise<Appointment | null>;
  findUpcomingAppointments(start: Date, end: Date): Promise<Appointment[]>;
  findByDoctorAndSlot(doctorId: string, date: Date, startTime: string, endTime: string): Promise<Appointment | null>;
  countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number>;
  countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number>;
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
  getDistinctPatientIdsByDoctor(doctorId: string): Promise<string[]>;
}
