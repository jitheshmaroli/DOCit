import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class UpdateDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    const updated = await this.doctorRepository.update(id, updates);
    if (!updated) throw new NotFoundError('Doctor not found');
    return updated;
  }
}
