import { QueryParams } from '../../../types/authTypes';
import { UserRole } from '../../../types';
import { SendMessageRequestDTO, ChatMessageResponseDTO, InboxResponseDTO, AddReactionRequestDTO } from '../ChatDTOs';

export interface IChatUseCase {
  sendMessage(message: SendMessageRequestDTO, file?: Express.Multer.File): Promise<ChatMessageResponseDTO>;
  getMessages(senderId: string, receiverId: string): Promise<ChatMessageResponseDTO[]>;
  deleteMessage(messageId: string, userId: string): Promise<void>;
  getChatHistory(userId: string, params: QueryParams): Promise<ChatMessageResponseDTO[]>;
  getInbox(userId: string, role: UserRole.Patient | UserRole.Doctor, params: QueryParams): Promise<InboxResponseDTO[]>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  addReaction(messageId: string, userId: string, dto: AddReactionRequestDTO): Promise<ChatMessageResponseDTO>;
}
