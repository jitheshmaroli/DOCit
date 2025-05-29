import { QueryParams } from '../../../types/authTypes';
import logger from '../../../utils/logger';
import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';

export class ListPatientsUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async executeWithQuery(params: QueryParams): Promise<{ data: Patient[]; totalItems: number }> {
    logger.debug('usecaseparams:', params);
    return this.patientRepository.findAllWithQuery(params);
  }
}
