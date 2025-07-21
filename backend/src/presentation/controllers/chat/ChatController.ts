import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CustomRequest, UserRole } from '../../../types';
import { IChatUseCase } from '../../../core/interfaces/use-cases/IChatUseCase';
import { IImageUploadService } from '../../../core/interfaces/services/IImageUploadService';
import { SocketService } from '../../../infrastructure/services/SocketService';
import { QueryParams } from '../../../types/authTypes';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class ChatController {
  private chatUseCase: IChatUseCase;
  private imageUploadService: IImageUploadService;
  private socketService: SocketService;

  constructor(container: Container) {
    this.chatUseCase = container.get<IChatUseCase>('IChatUseCase');
    this.imageUploadService = container.get<IImageUploadService>('IImageUploadService');
    this.socketService = container.get<SocketService>('SocketService');
  }

  async sendMessage(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { receiverId, message, senderName } = req.body;
      const chatMessage = await this.chatUseCase.sendMessage({
        message,
        senderId: userId,
        receiverId,
        role,
        senderName,
      });
      await this.socketService.sendMessageToUsers(chatMessage);
      res.status(HttpStatusCode.CREATED).json(chatMessage);
    } catch (error) {
      next(error);
    }
  }

  async sendAttachment(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { receiverId, senderName } = req.body;
      const file = req.file;
      if (!file) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const chatMessage = await this.chatUseCase.sendMessage(
        {
          message: '',
          senderId: userId,
          receiverId,
          role,
          senderName,
        },
        file
      );
      await this.socketService.sendMessageToUsers(chatMessage);
      res.status(HttpStatusCode.CREATED).json(chatMessage);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { receiverId } = req.params;
      const messages = await this.chatUseCase.getMessages(userId, receiverId);
      res.status(HttpStatusCode.OK).json(messages);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { messageId } = req.params;
      await this.chatUseCase.deleteMessage(messageId, userId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { messageId } = req.params;
      await this.chatUseCase.markMessageAsRead(messageId, userId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async addReaction(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { messageId } = req.params;
      const { emoji, replace } = req.body;
      const updatedMessage = await this.chatUseCase.addReaction(messageId, userId, emoji, replace);
      const receiverId = updatedMessage.senderId === userId ? updatedMessage.receiverId : updatedMessage.senderId;
      await this.socketService.sendReactionToUsers(messageId, emoji, userId, receiverId);
      res.status(HttpStatusCode.OK).json(updatedMessage);
    } catch (error) {
      next(error);
    }
  }

  async getChatHistory(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const params = req.query as QueryParams;
      const history = await this.chatUseCase.getChatHistory(userId, params);
      res.status(HttpStatusCode.OK).json(history);
    } catch (error) {
      next(error);
    }
  }

  async getInbox(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const params = req.query as QueryParams;
      const inbox = await this.chatUseCase.getInbox(userId, role as UserRole.Patient | UserRole.Doctor, params);
      res.status(HttpStatusCode.OK).json(inbox);
    } catch (error) {
      next(error);
    }
  }

  async getUserStatus(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { targetUserId, targetRole } = req.params;
      const isOnline = this.socketService.isUserOnline(targetUserId);
      const lastSeen = await this.socketService.getUserLastSeen(targetUserId, targetRole);
      res.status(HttpStatusCode.OK).json({
        userId: targetUserId,
        isOnline,
        lastSeen: lastSeen ? lastSeen.toISOString() : null,
      });
    } catch (error) {
      next(error);
    }
  }
}
