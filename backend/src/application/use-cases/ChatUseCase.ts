import { IChatUseCase } from '../../core/interfaces/use-cases/IChatUseCase';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { IChatRepository } from '../../core/interfaces/repositories/IChatRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IImageUploadService } from '../../core/interfaces/services/IImageUploadService';
import { QueryParams } from '../../types/authTypes';
import { UserRole } from '../../types';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { SocketService } from '../../infrastructure/services/SocketService';
import {
  SendMessageRequestDTO,
  ChatMessageResponseDTO,
  InboxResponseDTO,
  AddReactionRequestDTO,
} from '../dtos/ChatDTOs';
import { ChatMapper } from '../mappers/ChatMapper';

export class ChatUseCase implements IChatUseCase {
  constructor(
    private _chatRepository: IChatRepository,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _socketService: SocketService,
    private _imageUploadService: IImageUploadService
  ) {}

  async sendMessage(message: SendMessageRequestDTO, file?: Express.Multer.File): Promise<ChatMessageResponseDTO> {
    const sender =
      (await this._patientRepository.findById(message.senderName)) ||
      (await this._doctorRepository.findById(message.senderName));
    if (!sender) {
      logger.error(`Sender not found: ${message.senderName}`);
      throw new NotFoundError('Sender not found');
    }

    const receiver =
      (await this._patientRepository.findById(message.receiverId)) ||
      (await this._doctorRepository.findById(message.receiverId));
    if (!receiver) {
      logger.error(`Receiver not found: ${message.receiverId}`);
      throw new NotFoundError('Receiver not found');
    }

    let attachment: ChatMessage['attachment'] | undefined;
    if (file && this._imageUploadService) {
      try {
        const { url } = await this._imageUploadService.uploadFile(file, 'chat_attachments');
        attachment = {
          url,
          type: file.mimetype,
          name: file.originalname,
        };
      } catch (error) {
        logger.error(`Error uploading file: ${(error as Error).message}`);
        throw new Error('Failed to upload file');
      }
    }

    const newMessage = ChatMapper.toChatMessageEntity(message, message.senderName);
    newMessage.attachment = attachment;

    try {
      const savedMessage = await this._chatRepository.create(newMessage);
      return ChatMapper.toChatMessageResponseDTO(savedMessage);
    } catch (error) {
      logger.error(`Error sending message: ${(error as Error).message}`);
      throw new Error('Failed to send message');
    }
  }

  async getMessages(senderId: string, receiverId: string): Promise<ChatMessageResponseDTO[]> {
    if (!senderId || !receiverId) {
      logger.error('Sender ID and receiver ID are required for fetching messages');
      throw new ValidationError('Sender ID and receiver ID are required');
    }

    const messages = await this._chatRepository.findByParticipants(senderId, receiverId);
    return messages.map((message) => ChatMapper.toChatMessageResponseDTO(message));
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    if (!messageId || !userId) {
      logger.error('Message ID and user ID are required for deleting message');
      throw new ValidationError('Message ID and user ID are required');
    }

    const message = await this._chatRepository.findById(messageId);
    if (!message) {
      logger.error(`Message not found: ${messageId}`);
      throw new NotFoundError('Message not found');
    }

    if (message.senderId !== userId) {
      logger.error(`Unauthorized attempt to delete message ${messageId} by user ${userId}`);
      throw new ValidationError('You can only delete your own messages');
    }

    try {
      await this._chatRepository.delete(messageId);
    } catch (error) {
      logger.error(`Error deleting message ${messageId}: ${(error as Error).message}`);
      throw new Error('Failed to delete message');
    }
  }

  async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessageResponseDTO[]> {
    if (!userId) {
      logger.error('User ID is required for fetching chat history');
      throw new ValidationError('User ID is required');
    }

    const messages = await this._chatRepository.getChatHistory(userId, params);
    return messages.map((message) => ChatMapper.toChatMessageResponseDTO(message));
  }

  async getInbox(
    userId: string,
    role: UserRole.Patient | UserRole.Doctor,
    params: QueryParams
  ): Promise<InboxResponseDTO[]> {
    if (!userId || !role) {
      logger.error('User ID and role are required for fetching inbox');
      throw new ValidationError('User ID and role are required');
    }

    const inboxEntries = await this._chatRepository.getInbox(userId, params);

    const inboxResponses: InboxResponseDTO[] = await Promise.all(
      inboxEntries.map(async (entry) => {
        const partnerId = entry.partnerId;
        let partnerName: string;
        let partnerProfilePicture: string | undefined;
        let lastSeen: Date | undefined;

        const isOnline = this._socketService.isUserOnline(partnerId);

        if (role === UserRole.Patient) {
          const doctor = await this._doctorRepository.findById(partnerId);
          if (!doctor) {
            throw new ValidationError(`Doctor with ID ${partnerId} not found`);
          }
          partnerName = doctor.name || 'Unknown Doctor';
          partnerProfilePicture = doctor.profilePicture;
          lastSeen = doctor.lastSeen;
        } else {
          const patient = await this._patientRepository.findById(partnerId);
          if (!patient) {
            throw new ValidationError(`Patient with ID ${partnerId} not found`);
          }
          partnerName = patient.name || 'Unknown Patient';
          partnerProfilePicture = patient.profilePicture;
          lastSeen = patient.lastSeen;
        }

        return {
          _id: partnerId,
          receiverId: partnerId,
          senderName: partnerName,
          subject: 'Conversation',
          createdAt: entry.latestMessage?.createdAt?.toISOString() || new Date().toISOString(),
          partnerProfilePicture,
          latestMessage: entry.latestMessage
            ? ChatMapper.toChatMessageResponseDTO({
                ...entry.latestMessage,
                isRead: entry.latestMessage.isRead ?? false,
              })
            : null,
          unreadCount: entry.unreadCount || 0,
          isOnline,
          lastSeen: lastSeen ? lastSeen.toISOString() : undefined,
        };
      })
    );

    return inboxResponses;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    if (!messageId || !userId) {
      logger.error('Message ID and user ID are required for marking message as read');
      throw new ValidationError('Message ID and user ID are required');
    }

    const message = await this._chatRepository.findById(messageId);
    if (!message) {
      logger.error(`Message not found: ${messageId}`);
      throw new NotFoundError('Message not found');
    }

    if (message.receiverId !== userId) {
      logger.error(`Unauthorized attempt to mark message ${messageId} as read by user ${userId}`);
      throw new ValidationError('Unauthorized to mark this message as read');
    }

    try {
      await this._chatRepository.update(messageId, { isRead: true, unreadBy: [] });
    } catch (error) {
      logger.error(`Error marking message ${messageId} as read: ${(error as Error).message}`);
      throw new Error('Failed to mark message as read');
    }
  }

  async addReaction(messageId: string, userId: string, dto: AddReactionRequestDTO): Promise<ChatMessageResponseDTO> {
    if (!messageId || !userId || !dto.emoji) {
      logger.error('Message ID, user ID, and emoji are required for adding reaction');
      throw new ValidationError('Message ID, user ID, and emoji are required');
    }

    const message = await this._chatRepository.findById(messageId);
    if (!message) {
      logger.error(`Message not found: ${messageId}`);
      throw new NotFoundError('Message not found');
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      logger.error(`Unauthorized attempt to add reaction to message ${messageId} by user ${userId}`);
      throw new ValidationError('Unauthorized to add reaction to this message');
    }

    const updatedReactions = dto.replace
      ? [{ userId, emoji: dto.emoji }]
      : [...(message.reactions || []), { userId, emoji: dto.emoji }];

    try {
      const updatedMessage = await this._chatRepository.update(messageId, { reactions: updatedReactions });
      if (!updatedMessage) {
        logger.error(`Failed to add reaction to message ${messageId}`);
        throw new NotFoundError('Failed to add reaction');
      }
      return ChatMapper.toChatMessageResponseDTO(updatedMessage);
    } catch (error) {
      logger.error(`Error adding reaction to message ${messageId}: ${(error as Error).message}`);
      throw new Error('Failed to add reaction');
    }
  }
}
