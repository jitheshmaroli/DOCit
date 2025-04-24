import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class GetVerifiedDoctorsUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(): Promise<any[]> {
    return await this.doctorRepository.findVerified();
  }
}
