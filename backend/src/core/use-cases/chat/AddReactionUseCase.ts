import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { ValidationError } from '../../../utils/errors';
import { UpdateQuery } from 'mongoose';

export class AddReactionUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(messageId: string, userId: string, emoji: string, replace: boolean): Promise<ChatMessage> {
    if (!messageId || !userId || !emoji) {
      throw new ValidationError('Message ID, User ID, and emoji are required');
    }

    const message = await this.chatRepository.findById(messageId);
    if (!message) {
      throw new ValidationError('Message not found');
    }

    let updatedMessage: ChatMessage | null = null;

    if (replace) {
      const pullQuery: UpdateQuery<ChatMessage> = {
        $pull: { reactions: { userId } },
      };
      await this.chatRepository.update(messageId, pullQuery);

      const pushQuery: UpdateQuery<ChatMessage> = {
        $push: { reactions: { emoji, userId } },
      };
      updatedMessage = await this.chatRepository.update(messageId, pushQuery);
    } else {
      const pushQuery: UpdateQuery<ChatMessage> = {
        $push: { reactions: { emoji, userId } },
      };
      updatedMessage = await this.chatRepository.update(messageId, pushQuery);
    }

    if (!updatedMessage) {
      throw new ValidationError('Failed to add reaction');
    }

    return updatedMessage;
  }
}
