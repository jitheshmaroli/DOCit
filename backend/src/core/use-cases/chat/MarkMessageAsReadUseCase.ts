import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { ValidationError } from '../../../utils/errors';

export class MarkMessageAsReadUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(messageId: string, userId: string): Promise<void> {
    if (!messageId || !userId) {
      throw new ValidationError('Message ID and User ID are required');
    }
    await this.chatRepository.markAsRead(messageId, userId);
  }
}
