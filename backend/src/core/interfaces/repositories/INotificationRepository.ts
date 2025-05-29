import { IBaseRepository } from './IBaseRepository';
import { Notification } from '../../entities/Notification';
import { QueryParams } from '../../../types/authTypes';

export interface INotificationRepository extends IBaseRepository<Notification> {
  findByUserId(userId: string, params: QueryParams): Promise<Notification[]>;
  deleteAllByUserId(userId: string): Promise<void>;
  markAsRead(id: string): Promise<Notification | null>;
}
