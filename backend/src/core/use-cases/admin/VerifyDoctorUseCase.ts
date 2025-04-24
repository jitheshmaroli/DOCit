import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class VerifyDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string): Promise<Doctor> {
    const updated = await this.doctorRepository.update(doctorId, {
      isVerified: true,
    });
    if (!updated) throw new Error('Doctor not found');

    return updated;
  }
}
