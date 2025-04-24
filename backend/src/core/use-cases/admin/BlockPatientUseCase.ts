import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { NotFoundError } from '../../../utils/errors';

export class BlockPatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(id: string, isBlocked: boolean): Promise<Patient | null> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) throw new NotFoundError('Patient not found');
    return this.patientRepository.update(id, { isBlocked });
  }
}
