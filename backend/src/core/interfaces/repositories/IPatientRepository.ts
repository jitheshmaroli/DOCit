import { QueryParams } from '../../../types/authTypes';
import { Patient } from '../../entities/Patient';

export interface IPatientRepository {
  create(patient: Patient): Promise<Patient>;
  findByEmail(email: string): Promise<Patient | null>;
  findById(id: string): Promise<Patient | null>;
  update(id: string, patient: Partial<Patient>): Promise<Patient | null>;
  delete(id: string): Promise<void>;
  findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Patient[]; totalItems: number }>;
  updateSubscriptionStatus(
    patientId: string,
    isSubscribed: boolean
  ): Promise<Patient | null>;
  getPateintDetails(id: string): Promise<Patient | null>;
}
