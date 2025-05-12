import { QueryParams } from '../../../types/authTypes';
import { Speciality } from '../../entities/Speciality';
import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';

export class GetSpecialitiesUseCase {
  constructor(private specialityRepository: ISpecialityRepository) {}

  async execute(): Promise<Speciality[]> {
    return this.specialityRepository.findAll();
  }

  async executeWithQuery(params: QueryParams): Promise<{ data: Speciality[]; totalItems: number }> {
    return this.specialityRepository.findAllWithQuery(params);
  }
}
