import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class VerifyDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string): Promise<Doctor | null> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    return this.doctorRepository.update(doctorId, { isVerified: true });
  }
}
