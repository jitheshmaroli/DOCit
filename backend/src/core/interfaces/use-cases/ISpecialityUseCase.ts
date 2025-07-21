import { Speciality } from '../../entities/Speciality';
import { QueryParams } from '../../../types/authTypes';

export interface ISpecialityUseCase {
  addSpeciality(speciality: Partial<Speciality>): Promise<Speciality>;
  updateSpeciality(specialityId: string, updates: Partial<Speciality>): Promise<Speciality>;
  deleteSpeciality(specialityId: string): Promise<void>;
  getSpecialities(): Promise<Speciality[]>;
  getSpecialitiesWithQuery(params: QueryParams): Promise<{ data: Speciality[]; totalItems: number }>;
  getAllSpecialities(): Promise<Speciality[]>;
}
