import { Notification } from '../../entities/Notification';
import { QueryParams } from '../../../types/authTypes';

export interface INotificationRepository {
  create(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, params: QueryParams): Promise<Notification[]>;
  delete(id: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
  markAsRead(id: string): Promise<Notification | null>;
}
