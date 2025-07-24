import { INotificationUseCase } from '../interfaces/use-cases/INotificationUseCase';
import { Notification } from '../entities/Notification';
import { INotificationRepository } from '../interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';

export class NotificationUseCase implements INotificationUseCase {
  constructor(private _notificationRepository: INotificationRepository) {}

  async sendNotification(notification: Notification): Promise<Notification> {
    if (!notification.userId || !notification.message || !notification.type) {
      throw new ValidationError('User ID, message, and type are required for notification');
    }

    const createdNotification: Notification = {
      ...notification,
      isRead: false,
      createdAt: new Date(),
    };

    try {
      return await this._notificationRepository.create(createdNotification);
    } catch {
      throw new Error('Failed to create notification');
    }
  }

  async getNotifications(userId: string, params: QueryParams): Promise<Notification[]> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    return this._notificationRepository.findByUserId(userId, params);
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      throw new ValidationError('Notification ID and user ID are required');
    }

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ValidationError('You can only delete your own notifications');
    }

    await this._notificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    await this._notificationRepository.deleteAllByUserId(userId);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      throw new ValidationError('Notification ID and user ID are required');
    }

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ValidationError('Unauthorized to mark this notification as read');
    }

    if (notification.isRead) {
      return;
    }

    await this._notificationRepository.markAsRead(notificationId);
  }
}
