import { Doctor } from '../../entities/Doctor';
import { QueryParams } from '../../../types/authTypes';

export interface IDoctorUseCase {
  createDoctor(doctor: Partial<Doctor>): Promise<Doctor>;
  updateDoctor(doctorId: string, updates: Partial<Doctor>): Promise<Doctor>;
  deleteDoctor(doctorId: string): Promise<void>;
  blockDoctor(doctorId: string, isBlocked: boolean): Promise<Doctor>;
  verifyDoctor(doctorId: string): Promise<Doctor>;
  listDoctors(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }>;
  getDoctor(doctorId: string): Promise<Doctor | null>;
  getVerifiedDoctors(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }>;
}
