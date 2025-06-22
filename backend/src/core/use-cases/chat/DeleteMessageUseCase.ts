import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { ValidationError } from '../../../utils/errors';

export class DeleteMessageUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(messageId: string, userId: string): Promise<void> {
    const message = await this.chatRepository.findById(messageId);
    if (!message) {
      throw new ValidationError('Message not found');
    }
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ValidationError('You can only delete messages you sent or received');
    }
    await this.chatRepository.softDelete(messageId, userId);
  }
}
