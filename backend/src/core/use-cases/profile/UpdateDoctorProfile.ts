import { ForbiddenError, NotFoundError } from '../../../utils/errors';
import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';

export class UpdateDoctorProfileUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(
    doctorId: string,
    requesterId: string,
    updates: Partial<Doctor>
  ): Promise<Doctor | null> {
    if (doctorId !== requesterId) {
      throw new ForbiddenError('You can only update your own profile');
    }
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');
    return this.doctorRepository.update(doctorId, updates);
  }
}
