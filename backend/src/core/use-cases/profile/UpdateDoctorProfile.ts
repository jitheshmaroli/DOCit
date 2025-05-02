import { NotFoundError } from '../../../utils/errors';
import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class UpdateDoctorProfileUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(
    doctorId: string,
    updates: Partial<Doctor>
  ): Promise<Doctor | null> {
    
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');
    return this.doctorRepository.update(doctorId, updates);
  }
}
