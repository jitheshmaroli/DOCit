import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { QueryParams } from '../../../types/authTypes';

export class GetVerifiedDoctorsUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(
    params: QueryParams = {}
  ): Promise<{ data: any[]; totalItems: number }> {
    return await this.doctorRepository.findVerified(params);
  }
}
