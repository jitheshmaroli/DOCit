import { Speciality } from "../../entities/Speciality";

export interface ISpecialityRepository {
  create(speciality: Speciality): Promise<Speciality>;
  findAll(): Promise<Speciality[]>;
  findById(id: string): Promise<Speciality | null>;
  findByIds(ids: string[]): Promise<Speciality[]>;
  update(id: string, updates: Partial<Speciality>): Promise<Speciality>;
  delete(id: string): Promise<void>;
}