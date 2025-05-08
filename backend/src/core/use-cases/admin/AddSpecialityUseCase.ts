import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';
import { ValidationError } from '../../../utils/errors';
import { Speciality } from '../../entities/Speciality';

export class AddSpecialityUseCase {
  constructor(private specialityRepository: ISpecialityRepository) {}

  async execute(speciality: Partial<Speciality>): Promise<Speciality> {
    if (!speciality.name)
      throw new ValidationError('Speciality name is required');
    const existing = await this.specialityRepository.findAll();
    if (
      existing.some(
        s => s.name.toLowerCase() === speciality.name!.toLowerCase()
      )
    ) {
      throw new ValidationError('Speciality already exists');
    }
    return this.specialityRepository.create({ name: speciality.name });
  }
}
