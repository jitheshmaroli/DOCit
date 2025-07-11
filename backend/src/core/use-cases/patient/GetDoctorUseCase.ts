import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { Doctor } from '../../entities/Doctor';

export class GetDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string): Promise<Doctor | null> {
    const doctor = await this.doctorRepository.getDoctorDetails(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    return doctor;
  }
}
