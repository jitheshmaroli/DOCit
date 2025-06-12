import { Response, NextFunction } from 'express';
import { SendMessageUseCase } from '../../../core/use-cases/chat/SendMessageUseCase';
import { DeleteMessageUseCase } from '../../../core/use-cases/chat/DeleteMessageUseCase';
import { GetChatHistoryUseCase } from '../../../core/use-cases/chat/GetChatHistoryUseCase';
import { GetInboxUseCase } from '../../../core/use-cases/chat/GetInboxUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CustomRequest, UserRole } from '../../../types';
import { GetMessagesUseCase } from '../../../core/use-cases/chat/GetMessagesUseCase';
import { QueryParams } from '../../../types/authTypes';
import { IImageUploadService } from '../../../core/interfaces/services/IImageUploadService';

export class ChatController {
  private sendMessageUseCase: SendMessageUseCase;
  private getMessagesUseCase: GetMessagesUseCase;
  private deleteMessageUseCase: DeleteMessageUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  private getInboxUseCase: GetInboxUseCase;
  private imageUploadService: IImageUploadService;

  constructor(container: Container) {
    this.sendMessageUseCase = container.get('SendMessageUseCase');
    this.getMessagesUseCase = container.get('GetMessagesUseCase');
    this.deleteMessageUseCase = container.get('DeleteMessageUseCase');
    this.getChatHistoryUseCase = container.get('GetChatHistoryUseCase');
    this.getInboxUseCase = container.get('GetInboxUseCase');
    this.imageUploadService = container.get('ImageUploadService');
  }

  async sendMessage(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError('User ID not found in request');
      }
      const { receiverId, message, senderName } = req.body;
      const chatMessage = await this.sendMessageUseCase.execute({
        message,
        senderId: userId,
        receiverId,
        role,
        senderName,
      });
      res.status(201).json(chatMessage);
    } catch (error) {
      next(error);
    }
  }

  async sendAttachment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError('User ID not found in request');
      }
      const { receiverId, senderName } = req.body;
      const file = req.file;
      if (!file) {
        throw new ValidationError('No file provided');
      }
      const chatMessage = await this.sendMessageUseCase.execute(
        {
          message: '',
          senderId: userId,
          receiverId,
          role,
          senderName,
        },
        file
      );
      res.status(201).json(chatMessage);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const { receiverId } = req.params;
      const messages = await this.getMessagesUseCase.execute(userId, receiverId);
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const { messageId } = req.params;
      await this.deleteMessageUseCase.execute(messageId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getChatHistory(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const params = req.query as QueryParams;
      const history = await this.getChatHistoryUseCase.execute(userId, params);
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }

  async getInbox(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError('User ID or role not found in request');
      }
      const params = req.query as QueryParams;
      const inbox = await this.getInboxUseCase.execute(userId, role as UserRole.Patient | UserRole.Doctor, params);
      res.status(200).json(inbox);
    } catch (error) {
      next(error);
    }
  }
}
