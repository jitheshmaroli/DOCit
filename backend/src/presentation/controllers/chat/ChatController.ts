import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CustomRequest, UserRole } from '../../../types';
import { IChatUseCase } from '../../../core/interfaces/use-cases/IChatUseCase';
import { SocketService } from '../../../infrastructure/services/SocketService';
import { QueryParams } from '../../../types/authTypes';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import {
  SendMessageRequestDTO,
  AddReactionRequestDTO,
  ChatMessageResponseDTO,
  InboxResponseDTO,
} from '../../../core/interfaces/ChatDTOs';
import { ChatMessage } from '../../../core/entities/ChatMessage';
import { ChatMapper } from '../../../core/interfaces/mappers/ChatMapper';

export class ChatController {
  private _chatUseCase: IChatUseCase;
  private _socketService: SocketService;

  constructor(container: Container) {
    this._chatUseCase = container.get<IChatUseCase>('IChatUseCase');
    this._socketService = container.get<SocketService>('SocketService');
  }

  async sendMessage(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { receiverId, message, senderName } = req.body;
      if (!receiverId || !message || !senderName) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const dto: SendMessageRequestDTO = {
        receiverId,
        message,
        senderName,
      };
      const chatMessage: ChatMessageResponseDTO = await this._chatUseCase.sendMessage(dto);
      const chatMessageEntity: ChatMessage = ChatMapper.toChatMessageEntityFromResponse(chatMessage);
      await this._socketService.sendMessageToUsers(chatMessageEntity);
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
      if (!receiverId || !senderName || !file) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const dto: SendMessageRequestDTO = {
        receiverId,
        message: '',
        senderName,
      };
      const chatMessage: ChatMessageResponseDTO = await this._chatUseCase.sendMessage(dto, file);
      const chatMessageEntity: ChatMessage = ChatMapper.toChatMessageEntityFromResponse(chatMessage);
      await this._socketService.sendMessageToUsers(chatMessageEntity);
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
      if (!receiverId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const messages: ChatMessageResponseDTO[] = await this._chatUseCase.getMessages(userId, receiverId);
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
      if (!messageId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this._chatUseCase.deleteMessage(messageId, userId);
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
      if (!messageId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this._chatUseCase.markMessageAsRead(messageId, userId);
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
      if (!messageId || !emoji || replace === undefined) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const dto: AddReactionRequestDTO = { emoji, replace };
      const updatedMessage: ChatMessageResponseDTO = await this._chatUseCase.addReaction(messageId, userId, dto);
      const receiverId = updatedMessage.senderId === userId ? updatedMessage.receiverId : updatedMessage.senderId;
      await this._socketService.sendReactionToUsers(messageId, emoji, userId, receiverId);
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
      const history: ChatMessageResponseDTO[] = await this._chatUseCase.getChatHistory(userId, params);
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
      const inbox: InboxResponseDTO[] = await this._chatUseCase.getInbox(
        userId,
        role as UserRole.Patient | UserRole.Doctor,
        params
      );
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
      if (!targetUserId || !targetRole) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const isOnline = this._socketService.isUserOnline(targetUserId);
      const lastSeen = await this._socketService.getUserLastSeen(targetUserId, targetRole);
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
