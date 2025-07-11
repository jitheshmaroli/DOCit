import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { PaginatedResponse, QueryParams } from '../../../types/authTypes';
import { Doctor } from '../../entities/Doctor';

export class GetVerifiedDoctorsUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(params: QueryParams = {}): Promise<PaginatedResponse<Doctor>> {
    return await this.doctorRepository.findVerified(params);
  }
}
