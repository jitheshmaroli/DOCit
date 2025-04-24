import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { NotFoundError } from '../../../utils/errors';

export class UpdatePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(
    id: string,
    updates: Partial<Patient>
  ): Promise<Patient | null> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) throw new NotFoundError('Patient not found');
    return this.patientRepository.update(id, updates);
  }
}
