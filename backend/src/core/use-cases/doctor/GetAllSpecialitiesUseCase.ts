import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';
import { Speciality } from '../../entities/Speciality';

export class GetAllSpecialitiesUseCase {
  constructor(private specialityRepository: ISpecialityRepository) {}

  async execute(): Promise<Speciality[]> {
    return await this.specialityRepository.findAll();
  }
}
