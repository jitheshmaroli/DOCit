import { IBaseRepository } from './IBaseRepository';
import { Speciality } from '../../entities/Speciality';
import { QueryParams } from '../../../types/authTypes';

export interface ISpecialityRepository extends IBaseRepository<Speciality> {
  findAll(): Promise<Speciality[]>;
  findAllWithQuery(params: QueryParams): Promise<{ data: Speciality[]; totalItems: number }>;
  findByIds(specialityIds: string[]): Promise<Speciality[]>;
  findByName(name: string): Promise<Speciality | null>;
}
