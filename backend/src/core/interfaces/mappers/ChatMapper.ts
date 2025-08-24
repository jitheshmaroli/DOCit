import { ChatMessage } from '../../entities/ChatMessage';
import { ChatMessageResponseDTO, SendMessageRequestDTO } from '../ChatDTOs';

export class ChatMapper {
  static toChatMessageResponseDTO(message: ChatMessage): ChatMessageResponseDTO {
    return {
      _id: message._id?.toString() ?? '',
      message: message.message,
      senderId: message.senderId,
      receiverId: message.receiverId,
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
}
