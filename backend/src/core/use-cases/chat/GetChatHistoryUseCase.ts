import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { QueryParams } from '../../../types/authTypes';

export class GetChatHistoryUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(userId: string, params: QueryParams): Promise<ChatMessage[]> {
    return this.chatRepository.getChatHistory(userId, params);
  }
}
