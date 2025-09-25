import { INotificationUseCase } from '../../core/interfaces/use-cases/INotificationUseCase';
import { INotificationRepository } from '../../core/interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../types/authTypes';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { SendNotificationRequestDTO, NotificationResponseDTO } from '../dtos/NotificationDTOs';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { IValidatorService } from '../../core/interfaces/services/IValidatorService';
import { NotificationType } from '../../core/entities/Notification';

export class NotificationUseCase implements INotificationUseCase {
  constructor(
    private _notificationRepository: INotificationRepository,
    private _validatorService: IValidatorService
  ) {}

  async sendNotification(dto: SendNotificationRequestDTO): Promise<NotificationResponseDTO> {
    // Validations
    this._validatorService.validateRequiredFields({
      userId: dto.userId,
      message: dto.message,
      type: dto.type,
    });
    this._validatorService.validateIdFormat(dto.userId);
    this._validatorService.validateLength(dto.message, 1, 1000);
    this._validatorService.validateEnum(dto.type, Object.values(NotificationType));

    const createdNotification = NotificationMapper.toNotificationEntity(dto);

    const savedNotification = await this._notificationRepository.create(createdNotification);
    return NotificationMapper.toNotificationResponseDTO(savedNotification);
  }

  async getNotifications(userId: string, params: QueryParams): Promise<NotificationResponseDTO[]> {
    // Validations
    this._validatorService.validateRequiredFields({ userId });
    this._validatorService.validateIdFormat(userId);

    const notifications = await this._notificationRepository.findByUserId(userId, params);
    return notifications.map((notification) => NotificationMapper.toNotificationResponseDTO(notification));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    // Validations
    this._validatorService.validateRequiredFields({ notificationId });
    this._validatorService.validateIdFormat(notificationId);

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await this._notificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    // Validations
    this._validatorService.validateRequiredFields({ userId });
    this._validatorService.validateIdFormat(userId);

    await this._notificationRepository.deleteAllByUserId(userId);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    // Validations
    this._validatorService.validateRequiredFields({ notificationId, userId });
    this._validatorService.validateIdFormat(notificationId);
    this._validatorService.validateIdFormat(userId);

    const notification = await this._notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId?.toString() !== userId) {
      throw new ValidationError('Unauthorized to mark this notification as read');
    }

    if (notification.isRead) {
      return;
    }

    await this._notificationRepository.markAsRead(notificationId);
  }
}
