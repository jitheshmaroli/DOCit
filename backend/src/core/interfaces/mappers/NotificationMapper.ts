import { Notification } from '../../entities/Notification';
import { NotificationResponseDTO, SendNotificationRequestDTO } from '../NotificationDTOs';

export class NotificationMapper {
  static toNotificationResponseDTO(entity: Notification): NotificationResponseDTO {
    return {
      _id: entity._id?.toString() ?? '',
      userId: entity.userId,
      type: entity.type,
      message: entity.message,
      isRead: entity.isRead ?? false,
      createdAt: entity.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  static toNotificationEntity(dto: SendNotificationRequestDTO): Notification {
    return {
      userId: dto.userId,
      type: dto.type,
      message: dto.message,
      isRead: false,
      createdAt: new Date(),
    };
  }
}
