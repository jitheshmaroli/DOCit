import { IBaseRepository } from './IBaseRepository';
import { Patient } from '../../entities/Patient';
import { QueryParams } from '../../../types/authTypes';

export interface IPatientRepository extends IBaseRepository<Patient> {
  findByEmail(email: string): Promise<Patient | null>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }>;
  updateSubscriptionStatus(patientId: string, isSubscribed: boolean): Promise<Patient | null>;
}
