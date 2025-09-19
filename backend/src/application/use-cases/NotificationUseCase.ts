import { INotificationUseCase } from '../../core/interfaces/use-cases/INotificationUseCase';
import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { SendNotificationRequestDTO, NotificationResponseDTO } from '../dtos/NotificationDTOs';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';

export class NotificationUseCase implements INotificationUseCase {
  constructor(
    private _notificationRepository: INotificationRepository,
    private _validatorService: IValidatorService
  ) {}

  async sendNotification(dto: SendNotificationRequestDTO): Promise<NotificationResponseDTO> {
    // Validate required fields
    this._validatorService.validateRequiredFields({
      userId: dto.userId,
      message: dto.message,
      type: dto.type,
    });

    // Validate userId
    this._validatorService.validateIdFormat(dto.userId);

    // Validate message length
    this._validatorService.validateLength(dto.message, 1, 1000);

    // Validate notification type (assuming types are defined in a NotificationType enum or similar)
    this._validatorService.validateEnum(dto.type, ['INFO', 'WARNING', 'ERROR', 'SUCCESS']); // Adjust enum values as needed

    const createdNotification = NotificationMapper.toNotificationEntity(dto);

    try {
      const savedNotification = await this._notificationRepository.create(createdNotification);
      return NotificationMapper.toNotificationResponseDTO(savedNotification);
    } catch {
      throw new Error('Failed to create notification');
    }
  }

  async getNotifications(userId: string, params: QueryParams): Promise<NotificationResponseDTO[]> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ userId });

    // Validate userId
    this._validatorService.validateIdFormat(userId);

    const notifications = await this._notificationRepository.findByUserId(userId, params);
    return notifications.map((notification) => NotificationMapper.toNotificationResponseDTO(notification));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ notificationId });

    // Validate IDs
    this._validatorService.validateIdFormat(notificationId);

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await this._notificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ userId });

    // Validate userId
    this._validatorService.validateIdFormat(userId);

    await this._notificationRepository.deleteAllByUserId(userId);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    // Validate required fields
    this._validatorService.validateRequiredFields({ notificationId, userId });

    // Validate IDs
    this._validatorService.validateIdFormat(notificationId);
    this._validatorService.validateIdFormat(userId);

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
