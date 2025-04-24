import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class GetDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string): Promise<any> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    return doctor;
  }
}
