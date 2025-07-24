import { ChatMessage } from '../../entities/ChatMessage';
import { QueryParams } from '../../../types/authTypes';
import { InboxResponse } from '../../use-cases/ChatUseCase';
import { UserRole } from '../../../types';

export interface IChatUseCase {
  sendMessage(message: ChatMessage, file?: Express.Multer.File): Promise<ChatMessage>;
  getMessages(senderId: string, receiverId: string): Promise<ChatMessage[]>;
  deleteMessage(messageId: string, userId: string): Promise<void>;
  getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]>;
  getInbox(userId: string, role: UserRole.Patient | UserRole.Doctor, params: QueryParams): Promise<InboxResponse[]>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  addReaction(messageId: string, userId: string, emoji: string, replace: boolean): Promise<ChatMessage>;
}
