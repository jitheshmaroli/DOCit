import { UpdateQuery } from 'mongoose';
import { QueryParams } from '../../../types/authTypes';
import { InboxEntry } from '../../../types/chatTypes';
import { ChatMessage } from '../../entities/ChatMessage';
import { IBaseRepository } from './IBaseRepository';

export interface IChatRepository extends IBaseRepository<ChatMessage> {
  create(message: ChatMessage): Promise<ChatMessage>;
  findById(id: string): Promise<ChatMessage | null>;
  findByParticipants(senderId: string, receiverId: string): Promise<ChatMessage[]>;
  softDelete(id: string, userId: string): Promise<void>;
  markAsRead(messageId: string, userId: string): Promise<void>;
  getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]>;
  getInbox(userId: string, params: QueryParams): Promise<InboxEntry[]>;
  update(id: string, updates: UpdateQuery<ChatMessage>): Promise<ChatMessage | null>;
}
