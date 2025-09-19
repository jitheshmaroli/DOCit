import { Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CustomRequest } from '../../../types';
import { QueryParams } from '../../../types/authTypes';
import { INotificationUseCase } from '../../../core/interfaces/use-cases/INotificationUseCase';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';

export class NotificationController {
  private _notificationUseCase: INotificationUseCase;

  constructor(container: Container) {
    this._notificationUseCase = container.get<INotificationUseCase>('INotificationUseCase');
  }

  async sendNotification(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { userId: targetUserId, type, message } = req.body;
      if (!targetUserId || !type || !message) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      const sendNotificationData = {
        userId: targetUserId,
        type,
        message,
      };
      const notification = await this._notificationUseCase.sendNotification(sendNotificationData);
      res.status(HttpStatusCode.CREATED).json(notification);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const params = req.query as QueryParams;
      const notifications = await this._notificationUseCase.getNotifications(userId, params);
      res.status(HttpStatusCode.OK).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId } = req.params;
      if (!notificationId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this._notificationUseCase.deleteNotification(notificationId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async markNotificationAsRead(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      const { notificationId } = req.params;
      if (!notificationId) {
        throw new ValidationError(ResponseMessages.BAD_REQUEST);
      }
      await this._notificationUseCase.markNotificationAsRead(notificationId, userId);
      res.status(HttpStatusCode.OK).send();
    } catch (error) {
      next(error);
    }
  }

  async deleteAllNotifications(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError(ResponseMessages.USER_NOT_FOUND);
      }
      await this._notificationUseCase.deleteAllNotifications(userId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}
