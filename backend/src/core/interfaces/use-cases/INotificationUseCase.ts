import { Notification } from '../../entities/Notification';
import { QueryParams } from '../../../types/authTypes';

export interface INotificationUseCase {
  sendNotification(notification: Notification): Promise<Notification>;
  getNotifications(userId: string, params: QueryParams): Promise<Notification[]>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
}
