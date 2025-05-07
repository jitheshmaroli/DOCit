import { Speciality } from '../../core/entities/Speciality';
import { ISpecialityRepository } from '../../core/interfaces/repositories/ISpecialityRepository';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError } from '../../utils/errors';
import { QueryBuilder } from '../../utils/queryBuilder';
import { SpecialityModel } from '../database/models/SpecialityModel';

export class SpecialityRepository implements ISpecialityRepository {
  async create(speciality: Speciality): Promise<Speciality> {
    const newSpeciality = new SpecialityModel(speciality);
    return newSpeciality.save();
  }

  async findAll(): Promise<Speciality[]> {
    return SpecialityModel.find().exec();
  }

  async findAllWithQuery(
    params: QueryParams
  ): Promise<{ data: Speciality[]; totalItems: number }> {
    const query = QueryBuilder.buildQuery(params);
    const sort = QueryBuilder.buildSort(params);
    const { page, limit } = QueryBuilder.validateParams(params);

    const specialities = await SpecialityModel.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await SpecialityModel.countDocuments(query).exec();

    return { data: specialities, totalItems };
  }

  async findById(id: string): Promise<Speciality | null> {
    return SpecialityModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<Speciality[]> {
    return SpecialityModel.find({ _id: { $in: ids } }).exec();
  }

  async update(id: string, updates: Partial<Speciality>): Promise<Speciality> {
    const speciality = await SpecialityModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).exec();
    if (!speciality) throw new NotFoundError('Speciality not found');
    return speciality;
  }

  async delete(id: string): Promise<void> {
    const speciality = await SpecialityModel.findByIdAndDelete(id).exec();
    if (!speciality) throw new NotFoundError('Speciality not found');
  }
}
