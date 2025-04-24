import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class DeleteDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(id: string): Promise<void> {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) throw new NotFoundError('Doctor not found');
    await this.doctorRepository.delete(id);
  }
}
