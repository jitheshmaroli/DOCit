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
import { MarkMessageAsReadUseCase } from '../../../core/use-cases/chat/MarkMessageAsReadUseCase';
import { AddReactionUseCase } from '../../../core/use-cases/chat/AddReactionUseCase';
import { SocketService } from '../../../infrastructure/services/SocketService';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class ChatController {
  private sendMessageUseCase: SendMessageUseCase;
  private getMessagesUseCase: GetMessagesUseCase;
  private deleteMessageUseCase: DeleteMessageUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  private getInboxUseCase: GetInboxUseCase;
  private markMessageAsReadUseCase: MarkMessageAsReadUseCase;
  private addReactionUseCase: AddReactionUseCase;
  private imageUploadService: IImageUploadService;
  private socketService: SocketService;

  constructor(container: Container) {
    this.sendMessageUseCase = container.get('SendMessageUseCase');
    this.getMessagesUseCase = container.get('GetMessagesUseCase');
    this.deleteMessageUseCase = container.get('DeleteMessageUseCase');
    this.getChatHistoryUseCase = container.get('GetChatHistoryUseCase');
    this.getInboxUseCase = container.get('GetInboxUseCase');
    this.markMessageAsReadUseCase = container.get('MarkMessageAsReadUseCase');
    this.addReactionUseCase = container.get('AddReactionUseCase');
    this.imageUploadService = container.get('ImageUploadService');
    this.socketService = container.get('SocketService');
  }

  async sendMessage(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { receiverId, message, senderName } = req.body;
      const chatMessage = await this.sendMessageUseCase.execute({
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
      const messages = await this.getMessagesUseCase.execute(userId, receiverId);
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
      await this.deleteMessageUseCase.execute(messageId, userId);
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
      await this.markMessageAsReadUseCase.execute(messageId, userId);
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
      const updatedMessage = await this.addReactionUseCase.execute(messageId, userId, emoji, replace);
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
      const history = await this.getChatHistoryUseCase.execute(userId, params);
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
      const inbox = await this.getInboxUseCase.execute(userId, role as UserRole.Patient | UserRole.Doctor, params);
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
