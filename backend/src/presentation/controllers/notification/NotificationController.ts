import { Response, NextFunction } from 'express';
import { SendNotificationUseCase } from '../../../core/use-cases/notification/SendNotificationUseCase';
import { GetNotificationsUseCase } from '../../../core/use-cases/notification/GetNotificationsUseCase';
import { DeleteNotificationUseCase } from '../../../core/use-cases/notification/DeleteNotificationUseCase';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { CustomRequest } from '../../../types';
import { QueryParams } from '../../../types/authTypes';
import { MarkNotificationAsReadUseCase } from '../../../core/use-cases/notification/MarkNotificationAsReadUseCase';
import { DeleteAllNotificationsUseCase } from '../../../core/use-cases/notification/DeleteAllNotificationsUseCase';

export class NotificationController {
  private sendNotificationUseCase: SendNotificationUseCase;
  private getNotificationsUseCase: GetNotificationsUseCase;
  private deleteNotificationUseCase: DeleteNotificationUseCase;
  private markNotificationAsReadUseCase: MarkNotificationAsReadUseCase;
  private deleteAllNotificationsUseCase: DeleteAllNotificationsUseCase;

  constructor(container: Container) {
    this.sendNotificationUseCase = container.get('SendNotificationUseCase');
    this.getNotificationsUseCase = container.get('GetNotificationsUseCase');
    this.deleteNotificationUseCase = container.get('DeleteNotificationUseCase');
    this.markNotificationAsReadUseCase = container.get('MarkNotificationAsReadUseCase');
    this.deleteAllNotificationsUseCase = container.get('DeleteAllNotificationsUseCase');
  }

  async sendNotification(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const { userId: targetUserId, type, message } = req.body;
      const notification = await this.sendNotificationUseCase.execute({
        userId: targetUserId,
        type,
        message,
      });
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const params = req.query as QueryParams;
      const notifications = await this.getNotificationsUseCase.execute(userId, params);
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const { notificationId } = req.params;
      await this.deleteNotificationUseCase.execute(notificationId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async markNotificationAsRead(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      const { notificationId } = req.params;
      await this.markNotificationAsReadUseCase.execute(notificationId, userId);
      res.status(200).send();
    } catch (error) {
      next(error);
    }
  }

  async deleteAllNotifications(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }
      await this.deleteAllNotificationsUseCase.execute(userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
