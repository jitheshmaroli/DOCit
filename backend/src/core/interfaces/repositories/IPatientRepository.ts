import { Patient } from '../../entities/Patient';

export interface IPatientRepository {
  create(patient: Patient): Promise<Patient>;
  findByEmail(email: string): Promise<Patient | null>;
  findById(id: string): Promise<Patient | null>;
  update(id: string, patient: Partial<Patient>): Promise<Patient | null>;
  delete(id: string): Promise<void>;
  list(): Promise<Patient[]>;
  getPateintDetails(id: string): Promise<Patient | null>;
}
