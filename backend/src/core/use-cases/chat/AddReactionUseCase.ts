import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { ValidationError } from '../../../utils/errors';

export class AddReactionUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(messageId: string, userId: string, emoji: string): Promise<ChatMessage> {
    if (!messageId || !userId || !emoji) {
      throw new ValidationError('Message ID, User ID, and emoji are required');
    }

    const message = await this.chatRepository.findById(messageId);
    if (!message) {
      throw new ValidationError('Message not found');
    }

    const updatedMessage = await this.chatRepository.update(messageId, {
      $push: { reactions: { emoji, userId } },
    });

    if (!updatedMessage) {
      throw new ValidationError('Failed to add reaction');
    }

    return updatedMessage;
  }
}
