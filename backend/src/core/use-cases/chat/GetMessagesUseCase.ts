import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { QueryParams } from '../../../types/authTypes';

export class GetMessagesUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(senderId: string, receiverId: string, params: QueryParams): Promise<ChatMessage[]> {
    return this.chatRepository.findByParticipants(senderId, receiverId, params);
  }
}
