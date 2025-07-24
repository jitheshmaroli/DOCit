import { INotificationService } from '../../core/interfaces/services/INotificationService';
import { Notification } from '../../core/entities/Notification';
import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../types/authTypes';
import { SocketService } from './SocketService';

export class NotificationService implements INotificationService {
  constructor(
    private _notificationRepository: INotificationRepository,
    private _socketService: SocketService
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    const savedNotification = await this._notificationRepository.create(notification);
    await this._socketService.sendNotificationToUser(notification.userId, savedNotification);
  }

  async getNotifications(userId: string, params: QueryParams): Promise<Notification[]> {
    return this._notificationRepository.findByUserId(userId, params);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this._notificationRepository.delete(notificationId);
  }
}
