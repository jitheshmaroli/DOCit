import { IBaseRepository } from './IBaseRepository';
import { PaginatedResponse, QueryParams } from '../../../types/authTypes';
import { Doctor } from '../../entities/Doctor';

export interface IDoctorRepository extends IBaseRepository<Doctor> {
  findByEmail(email: string): Promise<Doctor | null>;
  findBySpeciality(specialityId: string): Promise<Doctor[]>;
  findVerified(params: QueryParams): Promise<PaginatedResponse<Doctor>>;
  findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]>;
  findAllWithQuery(params: QueryParams): Promise<PaginatedResponse<Doctor>>;
  getDoctorDetails(doctorId: string): Promise<Doctor | null>;
  findDoctorsWithActiveSubscriptions(): Promise<Doctor[]>;
  updateAllowFreeBooking(doctorId: string, allowFreeBooking: boolean): Promise<Doctor | null>;
}
