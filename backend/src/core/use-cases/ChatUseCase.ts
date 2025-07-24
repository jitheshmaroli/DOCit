import { IChatUseCase } from '../interfaces/use-cases/IChatUseCase';
import { ChatMessage } from '../entities/ChatMessage';
import { IChatRepository } from '../interfaces/repositories/IChatRepository';
import { IPatientRepository } from '../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../interfaces/repositories/IDoctorRepository';
import { IImageUploadService } from '../interfaces/services/IImageUploadService';
import { QueryParams } from '../../types/authTypes';
import { NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { SocketService } from '../../infrastructure/services/SocketService';

export interface InboxResponse {
  _id: string;
  receiverId: string;
  senderName: string;
  subject?: string;
  createdAt: string;
  partnerProfilePicture?: string;
  latestMessage: {
    _id: string;
    message: string;
    createdAt: Date;
    isSender: boolean;
  } | null;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export class ChatUseCase implements IChatUseCase {
  constructor(
    private _chatRepository: IChatRepository,
    private _patientRepository: IPatientRepository,
    private _doctorRepository: IDoctorRepository,
    private _socketService: SocketService,
    private _imageUploadService: IImageUploadService
  ) {}

  async sendMessage(message: ChatMessage, file?: Express.Multer.File): Promise<ChatMessage> {
    const sender =
      (await this._patientRepository.findById(message.senderId)) ||
      (await this._doctorRepository.findById(message.senderId));
    if (!sender) {
      logger.error(`Sender not found: ${message.senderId}`);
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

    const newMessage: ChatMessage = {
      ...message,
      attachment,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadBy: [message.receiverId],
    };

    try {
      const savedMessage = await this._chatRepository.create(newMessage);
      return savedMessage;
    } catch (error) {
      logger.error(`Error sending message: ${(error as Error).message}`);
      throw new Error('Failed to send message');
    }
  }

  async getMessages(senderId: string, receiverId: string): Promise<ChatMessage[]> {
    if (!senderId || !receiverId) {
      logger.error('Sender ID and receiver ID are required for fetching messages');
      throw new ValidationError('Sender ID and receiver ID are required');
    }

    return await this._chatRepository.findByParticipants(senderId, receiverId);
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

  async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]> {
    if (!userId) {
      logger.error('User ID is required for fetching chat history');
      throw new ValidationError('User ID is required');
    }

    return await this._chatRepository.getChatHistory(userId, params);
  }

  async getInbox(userId: string, role: 'patient' | 'doctor', params: QueryParams): Promise<InboxResponse[]> {
    if (!userId || !role) {
      logger.error('User ID and role are required for fetching inbox');
      throw new ValidationError('User ID and role are required');
    }

    const inboxEntries = await this._chatRepository.getInbox(userId, params);

    const inboxResponses: InboxResponse[] = await Promise.all(
      inboxEntries.map(async (entry) => {
        const partnerId = entry.partnerId;
        let partnerName: string;
        let partnerProfilePicture: string | undefined;
        let lastSeen: Date | undefined;

        const isOnline = this._socketService.isUserOnline(partnerId);

        if (role === 'patient') {
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
            ? {
                _id: entry.latestMessage._id!,
                message: entry.latestMessage.message,
                createdAt: entry.latestMessage.createdAt!,
                isSender: entry.latestMessage.senderId === userId,
              }
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
      await this._chatRepository.update(messageId, { isRead: true });
    } catch (error) {
      logger.error(`Error marking message ${messageId} as read: ${(error as Error).message}`);
      throw new Error('Failed to mark message as read');
    }
  }

  async addReaction(messageId: string, userId: string, emoji: string, replace: boolean): Promise<ChatMessage> {
    if (!messageId || !userId || !emoji) {
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

    const updatedReactions = replace ? [{ userId, emoji }] : [...(message.reactions || []), { userId, emoji }];

    try {
      const updatedMessage = await this._chatRepository.update(messageId, { reactions: updatedReactions });
      if (!updatedMessage) {
        logger.error(`Failed to add reaction to message ${messageId}`);
        throw new NotFoundError('Failed to add reaction');
      }
      return updatedMessage;
    } catch (error) {
      logger.error(`Error adding reaction to message ${messageId}: ${(error as Error).message}`);
      throw new Error('Failed to add reaction');
    }
  }
}
