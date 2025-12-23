import { ClientSession } from 'mongoose';

export interface ITransactionService {
  withTransaction<T>(operation: (session: ClientSession) => Promise<T>): Promise<T>;
}
