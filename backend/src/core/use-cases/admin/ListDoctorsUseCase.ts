import { QueryParams } from '../../../types/authTypes';
import logger from '../../../utils/logger';
import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class ListDoctorsUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async executeWithQuery(params: QueryParams): Promise<{ data: Doctor[]; totalItems: number }> {
    logger.debug('listdoctorusecase:', params);
    return this.doctorRepository.findAllWithQuery(params);
  }
}
