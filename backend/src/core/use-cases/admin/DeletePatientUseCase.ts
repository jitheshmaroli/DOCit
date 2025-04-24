import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { NotFoundError } from '../../../utils/errors';

export class DeletePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string): Promise<void> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) throw new NotFoundError('Patient not found');
    await this.patientRepository.delete(id);
  }
}
