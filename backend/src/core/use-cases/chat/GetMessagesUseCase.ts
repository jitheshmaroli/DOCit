import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';

export class GetMessagesUseCase {
  constructor(private chatRepository: IChatRepository) {}

  async execute(senderId: string, receiverId: string): Promise<ChatMessage[]> {
    return this.chatRepository.findByParticipants(senderId, receiverId);
  }
}
