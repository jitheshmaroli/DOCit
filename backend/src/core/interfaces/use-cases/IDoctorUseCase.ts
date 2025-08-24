import { QueryParams } from '../../../types/authTypes';
import { DoctorDTO, PaginatedDoctorResponseDTO } from '../DoctorDTOs';

export interface IDoctorUseCase {
  createDoctor(dto: Partial<DoctorDTO>): Promise<DoctorDTO>;
  updateDoctor(doctorId: string, updates: Partial<DoctorDTO>): Promise<DoctorDTO>;
  deleteDoctor(doctorId: string): Promise<void>;
  blockDoctor(doctorId: string, isBlocked: boolean): Promise<DoctorDTO>;
  verifyDoctor(doctorId: string): Promise<DoctorDTO>;
  listDoctors(params: QueryParams): Promise<PaginatedDoctorResponseDTO>;
  getDoctor(doctorId: string): Promise<DoctorDTO | null>;
  getVerifiedDoctors(params: QueryParams): Promise<PaginatedDoctorResponseDTO>;
}
