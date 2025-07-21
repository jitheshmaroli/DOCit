import { INotificationUseCase } from '../interfaces/use-cases/INotificationUseCase';
import { Notification } from '../entities/Notification';
import { INotificationRepository } from '../interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export class NotificationUseCase implements INotificationUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async sendNotification(notification: Notification): Promise<Notification> {
    if (!notification.userId || !notification.message || !notification.type) {
      logger.error('Missing required notification fields');
      throw new ValidationError('User ID, message, and type are required for notification');
    }

    const createdNotification: Notification = {
      ...notification,
      isRead: false,
      createdAt: new Date(),
    };

    try {
      return await this.notificationRepository.create(createdNotification);
    } catch (error) {
      logger.error(`Error creating notification: ${(error as Error).message}`);
      throw new Error('Failed to create notification');
    }
  }

  async getNotifications(userId: string, params: QueryParams): Promise<Notification[]> {
    if (!userId) {
      logger.error('User ID is required for fetching notifications');
      throw new ValidationError('User ID is required');
    }
    return this.notificationRepository.findByUserId(userId, params);
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      logger.error('Notification ID and user ID are required for deletion');
      throw new ValidationError('Notification ID and user ID are required');
    }

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      logger.error(`Notification not found: ${notificationId}`);
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      logger.error(`Unauthorized attempt to delete notification ${notificationId} by user ${userId}`);
      throw new ValidationError('You can only delete your own notifications');
    }

    await this.notificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    if (!userId) {
      logger.error('User ID is required for deleting all notifications');
      throw new ValidationError('User ID is required');
    }
    await this.notificationRepository.deleteAllByUserId(userId);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      logger.error('Notification ID and user ID are required for marking as read');
      throw new ValidationError('Notification ID and user ID are required');
    }

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      logger.error(`Notification not found: ${notificationId}`);
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      logger.error(`Unauthorized attempt to mark notification ${notificationId} as read by user ${userId}`);
      throw new ValidationError('Unauthorized to mark this notification as read');
    }

    if (notification.isRead) {
      logger.warn(`Notification ${notificationId} is already marked as read`);
      return;
    }

    await this.notificationRepository.markAsRead(notificationId);
  }
}
