import { Appointment, ExtendedAppointment } from '../../entities/Appointment';
import { QueryParams } from '../../../types/authTypes';
import { IBaseRepository } from './IBaseRepository';

export interface IAppointmentRepository extends IBaseRepository<Appointment> {
  findByIdPopulated(appointmentId: string): Promise<Appointment | null>;
  findUpcomingAppointments(start: Date, end: Date): Promise<ExtendedAppointment[]>;
  findByDoctorAndSlot(doctorId: string, date: Date, startTime: string, endTime: string): Promise<Appointment | null>;
  countByPatientAndDoctor(patientId: string, doctorId: string): Promise<number>;
  countByPatientAndDoctorWithFreeBooking(patientId: string, doctorId: string): Promise<number>;
  findByPatient(patientId: string): Promise<Appointment[]>;
  findBySubscriptionWithQuery(
    subscriptionId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }>;
  findByPatientAndDoctorWithQuery(
    patientId: string,
    doctorId: string,
    params: QueryParams
  ): Promise<{ data: Appointment[]; totalItems: number }>;
  findByDoctor(doctorId: string): Promise<Appointment[]>;
  findByDoctorWithQuery(doctorId: string, params: QueryParams): Promise<{ data: Appointment[]; totalItems: number }>;
  findAllWithQuery(params: QueryParams): Promise<{ data: ExtendedAppointment[]; totalItems: number }>;
  getDistinctPatientIdsByDoctor(doctorId: string): Promise<string[]>;
  completeAppointment(appointmentId: string, prescriptionId: string): Promise<Appointment>;
}
