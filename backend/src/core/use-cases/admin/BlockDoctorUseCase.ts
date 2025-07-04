import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class BlockDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string, isBlocked: boolean): Promise<Doctor> {
    const updated = await this.doctorRepository.update(doctorId, { isBlocked });

    if (!updated) throw new NotFoundError('Doctor not found');

    return updated;
  }
}
