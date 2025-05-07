import { QueryParams } from '../../../types/authTypes';
import { Doctor } from '../../entities/Doctor';

export interface IDoctorRepository {
  create(doctor: Doctor): Promise<Doctor>;
  findByEmail(email: string): Promise<Doctor | null>;
  findById(id: string): Promise<Doctor | null>;
  findBySpeciality(specialityId: string): Promise<Doctor[]>;
  findVerified(
    params: QueryParams
  ): Promise<{ data: any[]; totalItems: number }>;
  update(id: string, updates: Partial<Doctor>): Promise<Doctor | null>;
  findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]>;
  delete(id: string): Promise<void>;
  findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Doctor[]; totalItems: number }>;
  getDoctorDetails(id: string): Promise<Doctor | null>;
  findDoctorsWithActiveSubscriptions(): Promise<Doctor[]>;
  updateAllowFreeBooking(
    doctorId: string,
    allowFreeBooking: boolean
  ): Promise<Doctor | null>;
}
