import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { ForbiddenError, NotFoundError } from '../../../utils/errors';

export class UpdatePatientProfileUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(
    patientId: string,
    requesterId: string,
    updates: Partial<Patient>
  ): Promise<Patient | null> {
    if (patientId !== requesterId) {
      throw new ForbiddenError('You can only update your own profile');
    }
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    return this.patientRepository.update(patientId, updates);
  }
}
