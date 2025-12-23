import { ClientSession, UpdateQuery } from 'mongoose';

export interface IBaseRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string, session?: ClientSession): Promise<T | null>;
  update(id: string, updates: UpdateQuery<T>, session?: ClientSession): Promise<T | null>;
  delete(id: string): Promise<void>;
}
