import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class DeleteSpecialityUseCase {
  constructor(
    private specialityRepository: ISpecialityRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(specialityId: string): Promise<void> {
    const speciality = await this.specialityRepository.findById(specialityId);
    if (!speciality) throw new NotFoundError('Speciality not found');
    const doctors = await this.doctorRepository.findBySpeciality(specialityId);
    if (doctors.length > 0) {
      throw new ValidationError('Cannot delete speciality used by doctors');
    }
    await this.specialityRepository.delete(specialityId);
  }
}
