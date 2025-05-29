import { NotFoundError, ValidationError } from '../../../utils/errors';
import { Speciality } from '../../entities/Speciality';
import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';

export class UpdateSpecialityUseCase {
  constructor(private specialityRepository: ISpecialityRepository) {}

  async execute(id: string, updates: Partial<Speciality>): Promise<Speciality> {
    if (!updates.name) throw new ValidationError('Speciality name is required');
    const existing = await this.specialityRepository.findAll();
    if (existing.some((s) => s.name.toLowerCase() === updates.name!.toLowerCase() && s._id !== id)) {
      throw new ValidationError('Speciality name already exists');
    }
    const speciality = await this.specialityRepository.findById(id);
    if (!speciality) throw new NotFoundError('Speciality not found');
    const updatedSpeciality = await this.specialityRepository.update(id, { name: updates.name });
    if (!updatedSpeciality) throw new NotFoundError('Failed to update speciality');
    return updatedSpeciality;
  }
}
