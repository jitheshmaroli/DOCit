import mongoose, { ClientSession } from 'mongoose';
import { ITransactionService } from '../../core/interfaces/services/ITransactionService';

export class MongoTransactionService implements ITransactionService {
  async withTransaction<T>(operation: (session: ClientSession) => Promise<T>): Promise<T> {
    const session: ClientSession = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        return await operation(session);
      });
    } finally {
      await session.endSession();
    }
  }
}
