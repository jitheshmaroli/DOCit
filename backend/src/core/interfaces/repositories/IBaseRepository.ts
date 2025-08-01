import { UpdateQuery } from 'mongoose';

export interface IBaseRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<void>;
}
