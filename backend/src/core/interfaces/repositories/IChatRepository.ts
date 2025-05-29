import { QueryParams } from '../../../types/authTypes';
import { InboxEntry } from '../../../types/chatTypes';
import { ChatMessage } from '../../entities/ChatMessage';

export interface IChatRepository {
  create(message: ChatMessage): Promise<ChatMessage>;
  findById(id: string): Promise<ChatMessage | null>;
  findByParticipants(senderId: string, receiverId: string, params: QueryParams): Promise<ChatMessage[]>;
  softDelete(id: string): Promise<void>;
  getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]>;
  getInbox(userId: string, params: QueryParams): Promise<InboxEntry[]>;
}
