import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { ForbiddenError, NotFoundError } from '../../../utils/errors';

export class ViewPatientProfileUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(patientId: string, requesterId: string): Promise<Patient> {
    if (patientId !== requesterId) {
      throw new ForbiddenError('You can only view your own profile');
    }
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    return patient;
  }
}
