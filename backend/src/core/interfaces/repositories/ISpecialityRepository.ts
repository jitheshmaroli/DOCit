import { QueryParams } from "../../../types/authTypes";
import { Speciality } from "../../entities/Speciality";

export interface ISpecialityRepository {
  create(speciality: Speciality): Promise<Speciality>;
  findAll(): Promise<Speciality[]>;
  findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Speciality[]; totalItems: number }>;
  findById(id: string): Promise<Speciality | null>;
  findByIds(ids: string[]): Promise<Speciality[]>;
  update(id: string, updates: Partial<Speciality>): Promise<Speciality>;
  delete(id: string): Promise<void>;
}