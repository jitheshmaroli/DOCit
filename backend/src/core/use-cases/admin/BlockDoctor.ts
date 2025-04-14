import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class BlockDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(id: string, isBlocked: boolean): Promise<Doctor> {
    const updated = await this.doctorRepository.update(id, { isBlocked });
    if (!updated) throw new NotFoundError('Doctor not found');
    return updated;
  }
}
