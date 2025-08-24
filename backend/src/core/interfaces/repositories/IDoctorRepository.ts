import { IBaseRepository } from './IBaseRepository';
import { QueryParams } from '../../../types/authTypes';
import { DoctorDTO, PaginatedDoctorResponseDTO } from '../DoctorDTOs';

export interface IDoctorRepository extends IBaseRepository<DoctorDTO> {
  findByEmail(email: string): Promise<DoctorDTO | null>;
  findBySpeciality(specialityId: string): Promise<DoctorDTO[]>;
  findVerified(params: QueryParams): Promise<PaginatedDoctorResponseDTO>;
  findByCriteria(criteria: Partial<DoctorDTO>): Promise<DoctorDTO[]>;
  findAllWithQuery(params: QueryParams): Promise<PaginatedDoctorResponseDTO>;
  getDoctorDetails(doctorId: string): Promise<DoctorDTO | null>;
  findDoctorsWithActiveSubscriptions(): Promise<DoctorDTO[]>;
  updateAllowFreeBooking(doctorId: string, allowFreeBooking: boolean): Promise<DoctorDTO | null>;
}
