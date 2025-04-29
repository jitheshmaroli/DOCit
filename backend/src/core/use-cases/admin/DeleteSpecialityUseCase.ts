import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError, ValidationError } from '../../../utils/errors';

export class DeleteSpecialityUseCase {
  constructor(
    private specialityRepository: ISpecialityRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(id: string): Promise<void> {
    const speciality = await this.specialityRepository.findById(id);
    if (!speciality) throw new NotFoundError('Speciality not found');
    const doctors = await this.doctorRepository.findBySpeciality(id);
    if (doctors.length > 0) {
      throw new ValidationError('Cannot delete speciality used by doctors');
    }
    await this.specialityRepository.delete(id);
  }
}