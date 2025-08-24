import { IBaseRepository } from './IBaseRepository';
import { QueryParams } from '../../../types/authTypes';
import { PaginatedPatientResponseDTO, PatientDTO } from '../PatientDTOs';

export interface IPatientRepository extends IBaseRepository<PatientDTO> {
  findByEmail(email: string): Promise<PatientDTO | null>;
  findAllWithQuery(params: QueryParams): Promise<PaginatedPatientResponseDTO>;
  updateSubscriptionStatus(patientId: string, isSubscribed: boolean): Promise<PatientDTO | null>;
}
