import { Notification } from '../../entities/Notification';
import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { QueryParams } from '../../../types/authTypes';

export class GetNotificationsUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async execute(userId: string, params: QueryParams): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId, params);
  }
}
