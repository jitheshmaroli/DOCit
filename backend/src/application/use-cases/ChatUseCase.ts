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
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';

export class ChatUseCase implements IChatUseCase {
  constructor(
    private _chatRepository: IChatRepository,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _socketService: SocketService,
    private _imageUploadService: IImageUploadService,
    private _validatorService: IValidatorService
  ) {}

  async sendMessage(message: SendMessageRequestDTO, file?: Express.Multer.File): Promise<ChatMessageResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      senderName: message.senderName,
      receiverId: message.receiverId,
      message: message.message,
    });

    // Validate IDs
    this._validatorService.validateIdFormat(message.senderName);
    this._validatorService.validateIdFormat(message.receiverId);

    // Validate message content
    this._validatorService.validateLength(message.message, 1, 2000);

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
      // Validate file (basic check for mimetype and size)
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
        throw new ValidationError('Invalid file type. Only JPEG, PNG, or PDF allowed.');
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        throw new ValidationError('File size exceeds 5MB limit.');
      }

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
    // Validate required fields
    this._validatorService.validateRequiredFields({ senderId, receiverId });

    // Validate IDs
    this._validatorService.validateIdFormat(senderId);
    this._validatorService.validateIdFormat(receiverId);

    const messages = await this._chatRepository.findByParticipants(senderId, receiverId);
    return messages.map((message) => ChatMapper.toChatMessageResponseDTO(message));
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ messageId, userId });

    // Validate IDs
    this._validatorService.validateIdFormat(messageId);
    this._validatorService.validateIdFormat(userId);

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
    // Validate required fields
    this._validatorService.validateRequiredFields({ userId });

    // Validate userId
    this._validatorService.validateIdFormat(userId);

    const messages = await this._chatRepository.getChatHistory(userId, params);
    return messages.map((message) => ChatMapper.toChatMessageResponseDTO(message));
  }

  async getInbox(
    userId: string,
    role: UserRole.Patient | UserRole.Doctor,
    params: QueryParams
  ): Promise<InboxResponseDTO[]> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ userId, role });

    // Validate userId and role
    this._validatorService.validateIdFormat(userId);
    this._validatorService.validateEnum(role, [UserRole.Patient, UserRole.Doctor]);

    const inboxEntries = await this._chatRepository.getInbox(userId, params);

    const inboxResponses: InboxResponseDTO[] = await Promise.all(
      inboxEntries.map(async (entry) => {
        const partnerId = entry.partnerId;
        this._validatorService.validateIdFormat(partnerId); // Validate partnerId

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
    // Validate required fields
    this._validatorService.validateRequiredFields({ messageId, userId });

    // Validate IDs
    this._validatorService.validateIdFormat(messageId);
    this._validatorService.validateIdFormat(userId);

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
    // Validate required fields
    this._validatorService.validateRequiredFields({ messageId, userId, emoji: dto.emoji });

    // Validate IDs
    this._validatorService.validateIdFormat(messageId);
    this._validatorService.validateIdFormat(userId);

    // Validate emoji (basic length check, assuming single emoji or short string)
    this._validatorService.validateLength(dto.emoji, 1, 10);

    // Validate replace flag
    this._validatorService.validateBoolean(dto.replace);

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
