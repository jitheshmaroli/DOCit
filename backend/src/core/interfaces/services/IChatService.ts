import { ChatMessage } from '../../entities/ChatMessage';
import { QueryParams } from '../../../types/authTypes';

export interface IChatService {
  sendMessage(message: ChatMessage): Promise<ChatMessage>;
  getMessages(senderId: string, receiverId: string, params: QueryParams): Promise<ChatMessage[]>;
  deleteMessage(messageId: string, userId: string): Promise<void>;
  getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]>;
}
