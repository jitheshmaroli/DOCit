import mongoose, { Model, UpdateQuery } from 'mongoose';
import { IBaseRepository } from '../../core/interfaces/repositories/IBaseRepository';

export class BaseRepository<T> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(entity: T): Promise<T> {
    const newEntity = new this.model(entity);
    const savedEntity = await newEntity.save();
    return savedEntity.toObject() as T;
  }

  async findById(id: string): Promise<T | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const entity = await this.model.findById(id).exec();
      return entity ? (entity.toObject() as T) : null;
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        console.warn(`CastError in findById for id: ${id}`);
        return null;
      }
      throw error;
    }
  }

  async update(id: string, updates: UpdateQuery<T>): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const entity = await this.model.findByIdAndUpdate(id, updates, { new: true }).exec();
    return entity ? (entity.toObject() as T) : null;
  }

  async delete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await this.model.findByIdAndDelete(id).exec();
  }
}
