import { NotificationType } from '../entities/Notification';

export interface SendNotificationRequestDTO {
  userId: string;
  type: NotificationType;
  message: string;
}

export interface NotificationResponseDTO {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}
