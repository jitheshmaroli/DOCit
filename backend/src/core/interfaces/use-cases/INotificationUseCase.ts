import { QueryParams } from '../../../types/authTypes';
import { SendNotificationRequestDTO, NotificationResponseDTO } from '../../../application/dtos/NotificationDTOs';

export interface INotificationUseCase {
  sendNotification(dto: SendNotificationRequestDTO): Promise<NotificationResponseDTO>;
  getNotifications(userId: string, params: QueryParams): Promise<NotificationResponseDTO[]>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
}
