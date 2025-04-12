import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class ListVerifiedDoctorsUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(): Promise<Doctor[]> {
    return this.doctorRepository.listVerified();
  }
}
