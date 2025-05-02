import { NotFoundError } from '../../../utils/errors';
import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class ViewDoctorProfileUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');
    return doctor;
  }
}
