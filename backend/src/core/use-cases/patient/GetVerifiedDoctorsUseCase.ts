import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { QueryParams } from '../../../types/authTypes';
import { Doctor } from '../../entities/Doctor';

export class GetVerifiedDoctorsUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(params: QueryParams = {}): Promise<{ data: Doctor[]; totalItems: number }> {
    return await this.doctorRepository.findVerified(params);
  }
}
