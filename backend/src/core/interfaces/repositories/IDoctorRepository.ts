import { Doctor } from '../../entities/Doctor';

export interface IDoctorRepository {
  create(doctor: Doctor): Promise<Doctor>;
  findByEmail(email: string): Promise<Doctor | null>;
  findById(id: string): Promise<Doctor | null>;
  findVerified(): Promise<Doctor[]>;
  update(id: string, updates: Partial<Doctor>): Promise<Doctor | null>;
  findByCriteria(criteria: Partial<Doctor>): Promise<Doctor[]>;
  delete(id: string): Promise<void>;
  list(): Promise<Doctor[]>;
  getDoctorDetails(id: string): Promise<Doctor | null>;
}
