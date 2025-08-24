import { QueryParams } from '../../../types/authTypes';
import { PatientDTO, PatientSubscriptionDTO, PaginatedPatientResponseDTO } from '../PatientDTOs';

export interface IPatientUseCase {
  createPatient(dto: Partial<PatientDTO>): Promise<PatientDTO>;
  updatePatient(patientId: string, updates: Partial<PatientDTO>): Promise<PatientDTO | null>;
  deletePatient(patientId: string): Promise<void>;
  blockPatient(patientId: string, isBlocked: boolean): Promise<PatientDTO | null>;
  listPatients(params: QueryParams): Promise<PaginatedPatientResponseDTO>;
  getPatientSubscriptions(patientId: string): Promise<PatientSubscriptionDTO[]>;
  getPatientActiveSubscription(patientId: string, doctorId: string): Promise<PatientSubscriptionDTO | null>;
  getSubscribedPatients(doctorId: string): Promise<PatientDTO[] | null>;
}
