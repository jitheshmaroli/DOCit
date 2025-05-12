import { QueryParams } from '../../../types/authTypes';
import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';

export class ListPatientsUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async executeWithQuery(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }> {
    return this.patientRepository.findAllWithQuery(params);
  }
}
