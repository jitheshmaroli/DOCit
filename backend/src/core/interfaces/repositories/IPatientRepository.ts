import { IBaseRepository } from './IBaseRepository';
import { Patient } from '../../entities/Patient';
import { QueryParams } from '../../../types/authTypes';
import { ClientSession, FilterQuery } from 'mongoose';

export interface IPatientRepository extends IBaseRepository<Patient> {
  findByEmail(email: string): Promise<Patient | null>;
  findOne(query: FilterQuery<Patient>): Promise<Patient | null>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }>;
  updateSubscriptionStatus(patientId: string, isSubscribed: boolean, session?: ClientSession): Promise<Patient | null>;
}
