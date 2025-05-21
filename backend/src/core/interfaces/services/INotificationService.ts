import { Notification } from '../../entities/Notification';
import { QueryParams } from '../../../types/authTypes';

export interface INotificationService {
  sendNotification(notification: Notification): Promise<void>;
  getNotifications(userId: string, params: QueryParams): Promise<Notification[]>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
}
