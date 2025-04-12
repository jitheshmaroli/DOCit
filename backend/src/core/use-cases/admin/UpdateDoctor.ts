import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class UpdateDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) throw new NotFoundError('Doctor not found');
    return this.doctorRepository.update(id, updates);
  }
}
