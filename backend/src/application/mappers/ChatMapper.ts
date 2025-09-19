import { ChatMessage } from '../../core/entities/ChatMessage';
import { ChatMessageResponseDTO, SendMessageRequestDTO } from '../dtos/ChatDTOs';

export class ChatMapper {
  static toChatMessageResponseDTO(message: ChatMessage): ChatMessageResponseDTO {
    return {
      _id: message._id?.toString() ?? '',
      message: message.message,
      senderId: message.senderId?.toString() ?? '',
      receiverId: message.receiverId?.toString() ?? '',
      createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
      attachment: message.attachment,
      isRead: message.isRead ?? false,
      reactions: message.reactions,
    };
  }

  static toChatMessageEntity(dto: SendMessageRequestDTO, senderId: string): ChatMessage {
    return {
      senderId,
      receiverId: dto.receiverId,
      message: dto.message,
      senderName: dto.senderName,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadBy: [dto.receiverId],
    };
  }

  static toChatMessageEntityFromResponse(dto: ChatMessageResponseDTO): ChatMessage {
    return {
      _id: dto._id,
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      message: dto.message,
      createdAt: new Date(dto.createdAt),
      isRead: dto.isRead,
      attachment: dto.attachment,
      reactions: dto.reactions,
      unreadBy: dto.isRead ? undefined : [dto.receiverId],
      updatedAt: new Date(),
    };
  }
}
