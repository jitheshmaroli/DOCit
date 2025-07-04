import { IBaseRepository } from './IBaseRepository';
import { Doctor } from '../../entities/Doctor';
import { QueryParams } from '../../../types/authTypes';

export interface IDoctorRepository extends IBaseRepository<Doctor> {
  findByEmail(email: string): Promise<Doctor | null>;
  findBySpeciality(specialityId: string): Promise<Doctor[]>;
  findVerified(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }>;
  findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }>;
  getDoctorDetails(doctorId: string): Promise<Doctor | null>;
  findDoctorsWithActiveSubscriptions(): Promise<Doctor[]>;
  updateAllowFreeBooking(doctorId: string, allowFreeBooking: boolean): Promise<Doctor | null>;
}
