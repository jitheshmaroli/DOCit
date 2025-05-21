import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { ValidationError } from '../../../utils/errors';

export class DeleteMessageUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(messageId: string, userId: string): Promise<void> {
    const message = await this.chatRepository.findById(messageId);
    if (!message) {
      throw new ValidationError('Message not found');
    }
    if (message.senderId !== userId) {
      throw new ValidationError('You can only delete your own messages');
    }
    await this.chatRepository.softDelete(messageId);
  }
}
