import { Patient } from '../../entities/Patient';
import { PatientSubscription } from '../../entities/PatientSubscription';
import { QueryParams } from '../../../types/authTypes';

export interface IPatientUseCase {
  createPatient(patient: Partial<Patient>): Promise<Patient>;
  updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient | null>;
  deletePatient(patientId: string): Promise<void>;
  blockPatient(patientId: string, isBlocked: boolean): Promise<Patient | null>;
  listPatients(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }>;
  getPatientSubscriptions(patientId: string): Promise<PatientSubscription[]>;
  getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscription | null>;
}
