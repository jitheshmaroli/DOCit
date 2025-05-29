import { ISpecialityRepository } from '../../core/interfaces/repositories/ISpecialityRepository';
import { BaseRepository } from './BaseRepository';
import { SpecialityModel } from '../database/models/SpecialityModel';
import { QueryParams } from '../../types/authTypes';
import { Speciality } from '../../core/entities/Speciality';
import { FilterQuery } from 'mongoose';

export class SpecialityRepository extends BaseRepository<Speciality> implements ISpecialityRepository {
  constructor() {
    super(SpecialityModel);
  }

  async findAll(): Promise<Speciality[]> {
    const specialities = await this.model.find().exec();
    return specialities.map((spec) => spec.toObject() as Speciality);
  }

  async findAllWithQuery(params: QueryParams): Promise<{ data: Speciality[]; totalItems: number }> {
    const { search = '', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const query: FilterQuery<Speciality> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const specialities = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalItems = await this.model.countDocuments(query).exec();

    return { data: specialities.map((spec) => spec.toObject() as Speciality), totalItems };
  }

  async findByIds(ids: string[]): Promise<Speciality[]> {
    const specialities = await this.model.find({ _id: { $in: ids } }).exec();
    return specialities.map((spec) => spec.toObject() as Speciality);
  }
}
