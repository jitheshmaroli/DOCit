import { IChatUseCase } from '../../core/interfaces/use-cases/IChatUseCase';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { IChatRepository } from '../../core/interfaces/repositories/IChatRepository';
import { IPatientRepository } from '../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../core/interfaces/repositories/IDoctorRepository';
import { IImageUploadService } from '../../core/interfaces/services/IImageUploadService';
import { QueryParams } from '../../types/authTypes';
import { UserRole } from '../../types';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { SocketService } from '../../infrastructure/services/SocketService';
import {
  SendMessageRequestDTO,
  ChatMessageResponseDTO,
  InboxResponseDTO,
  AddReactionRequestDTO,
} from '../dtos/ChatDTOs';
import { ChatMapper } from '../mappers/ChatMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import logger from '../../utils/logger';

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
    // Validations
    this._validatorService.validateRequiredFields({
      senderName: message.senderName,
      receiverId: message.receiverId,
      message: message.message,
    });
    this._validatorService.validateIdFormat(message.senderName);
    this._validatorService.validateIdFormat(message.receiverId);
    this._validatorService.validateLength(message.message, 1, 2000);

    const sender =
      (await this._patientRepository.findById(message.senderName)) ||
      (await this._doctorRepository.findById(message.senderName));
    if (!sender) {
      throw new NotFoundError('Sender not found');
    }

    const receiver =
      (await this._patientRepository.findById(message.receiverId)) ||
      (await this._doctorRepository.findById(message.receiverId));
    if (!receiver) {
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

      const { url } = await this._imageUploadService.uploadFile(file, 'chat_attachments');
      attachment = {
        url,
        type: file.mimetype,
        name: file.originalname,
      };
    }

    const newMessage = ChatMapper.toChatMessageEntity(message, message.senderName);
    newMessage.attachment = attachment;

    const savedMessage = await this._chatRepository.create(newMessage);
    return ChatMapper.toChatMessageResponseDTO(savedMessage);
  }

  async getMessages(senderId: string, receiverId: string): Promise<ChatMessageResponseDTO[]> {
    // Validations
    this._validatorService.validateRequiredFields({ senderId, receiverId });
    this._validatorService.validateIdFormat(senderId);
    this._validatorService.validateIdFormat(receiverId);

    const messages = await this._chatRepository.findByParticipants(senderId, receiverId);
    return messages.map((message) => ChatMapper.toChatMessageResponseDTO(message));
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Validations
    this._validatorService.validateRequiredFields({ messageId, userId });
    this._validatorService.validateIdFormat(messageId);
    this._validatorService.validateIdFormat(userId);

    const message = await this._chatRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    await this._chatRepository.delete(messageId);
  }

  async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessageResponseDTO[]> {
    // Validations
    this._validatorService.validateRequiredFields({ userId });
    this._validatorService.validateIdFormat(userId);

    const messages = await this._chatRepository.getChatHistory(userId, params);
    return messages.map((message) => ChatMapper.toChatMessageResponseDTO(message));
  }

  async getInbox(
    userId: string,
    role: UserRole.Patient | UserRole.Doctor,
    params: QueryParams
  ): Promise<InboxResponseDTO[]> {
    // Validations
    this._validatorService.validateRequiredFields({ userId, role });
    this._validatorService.validateIdFormat(userId);
    this._validatorService.validateEnum(role, [UserRole.Patient, UserRole.Doctor]);

    const inboxEntries = await this._chatRepository.getInbox(userId, params);

    const inboxResponses: InboxResponseDTO[] = [];
    await Promise.all(
      inboxEntries.map(async (entry) => {
        const partnerId = entry.partnerId.toString();
        this._validatorService.validateIdFormat(partnerId);

        let partnerName = 'Unknown';
        let partnerProfilePicture: string | undefined;
        let lastSeen: Date | undefined;

        const isOnline = this._socketService.isUserOnline(partnerId);

        try {
          if (role === UserRole.Patient) {
            const doctor = await this._doctorRepository.findById(partnerId);
            logger.info(`doctorifpatient: ${doctor}`);
            if (doctor) {
              partnerName = doctor.name || 'Unknown Doctor';
              partnerProfilePicture = doctor.profilePicture;
              lastSeen = doctor.lastSeen;
            } else {
              logger.warn(`Doctor with ID ${partnerId} not found, skipping inbox entry`);
              return;
            }
          } else if (role === UserRole.Doctor) {
            const patient = await this._patientRepository.findById(partnerId);
            logger.info(`patientifdoctor: ${patient}`);
            if (patient) {
              partnerName = patient.name || 'Unknown Patient';
              partnerProfilePicture = patient.profilePicture;
              lastSeen = patient.lastSeen;
            } else {
              logger.warn(`Patient with ID ${partnerId} not found, skipping inbox entry`);
              return;
            }
          }

          inboxResponses.push({
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
          });
        } catch (error: unknown) {
          logger.error(`Error processing inbox entry for partnerId ${partnerId}: ${error}`);
        }
      })
    );

    return inboxResponses;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    // Validations
    this._validatorService.validateRequiredFields({ messageId, userId });
    this._validatorService.validateIdFormat(messageId);
    this._validatorService.validateIdFormat(userId);

    const message = await this._chatRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ValidationError('Unauthorized to mark this message as read');
    }

    await this._chatRepository.update(messageId, { isRead: true, unreadBy: [] });
  }

  async addReaction(messageId: string, userId: string, dto: AddReactionRequestDTO): Promise<ChatMessageResponseDTO> {
    // Validations
    this._validatorService.validateRequiredFields({ messageId, userId, emoji: dto.emoji });
    this._validatorService.validateIdFormat(messageId);
    this._validatorService.validateIdFormat(userId);
    this._validatorService.validateLength(dto.emoji, 1, 10);
    this._validatorService.validateBoolean(dto.replace);

    const message = await this._chatRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.senderId?.toString() !== userId && message.receiverId?.toString() !== userId) {
      throw new ValidationError('Unauthorized to add reaction to this message');
    }

    const updatedReactions = dto.replace
      ? [{ userId, emoji: dto.emoji }]
      : [...(message.reactions || []), { userId, emoji: dto.emoji }];

    const updatedMessage = await this._chatRepository.update(messageId, { reactions: updatedReactions });
    if (!updatedMessage) {
      throw new NotFoundError('Failed to add reaction');
    }
    return ChatMapper.toChatMessageResponseDTO(updatedMessage);
  }
}
