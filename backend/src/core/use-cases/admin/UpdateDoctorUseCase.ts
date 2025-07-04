import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';

export class UpdateDoctorUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private specialityRepository: ISpecialityRepository
  ) {}

  async execute(doctorId: string, updates: Partial<Doctor>): Promise<Doctor> {
    if (updates.speciality) {
      const validSpecialities = await this.specialityRepository.findByIds([updates.speciality]);
      if (validSpecialities.length !== updates.speciality.length) {
        throw new ValidationError('One or more selected specialities are invalid');
      }
    }
    const updated = await this.doctorRepository.update(doctorId, updates);
    if (!updated) throw new NotFoundError('Doctor not found');
    return updated;
  }
}
