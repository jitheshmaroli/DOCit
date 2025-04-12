import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class BlockDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(id: string, isBlocked: boolean): Promise<Doctor | null> {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) throw new NotFoundError('Doctor not found');
    return this.doctorRepository.update(id, { isBlocked });
  }
}
