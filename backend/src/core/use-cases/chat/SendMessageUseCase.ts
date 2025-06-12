import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { ValidationError } from '../../../utils/errors';
import { UserRole } from '../../../types';
import logger from '../../../utils/logger';
import { IImageUploadService } from '../../interfaces/services/IImageUploadService';

export class SendMessageUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private imageUploadService?: IImageUploadService
  ) {}

  async execute(message: ChatMessage, file?: Express.Multer.File): Promise<ChatMessage> {
    let patientId: string;
    let doctorId: string;

    if (message.role === UserRole.Patient) {
      patientId = message.senderId;
      doctorId = message.receiverId;
    } else if (message.role === UserRole.Doctor) {
      patientId = message.receiverId;
      doctorId = message.senderId;
    } else {
      throw new ValidationError('Invalid user role');
    }

    const subscription = await this.patientSubscriptionRepository.findActiveByPatientAndDoctor(patientId, doctorId);

    if (!subscription) {
      throw new ValidationError('You must be subscribed to this doctor to send messages');
    }

    let attachment: ChatMessage['attachment'] | undefined;
    if (file && this.imageUploadService) {
      const { url } = await this.imageUploadService.uploadFile(file, 'chat_attachments');
      attachment = {
        url,
        type: file.mimetype,
        name: file.originalname,
      };
    }

    logger.debug('message:', message);
    const createdMessage = await this.chatRepository.create({
      ...message,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachment,
    });
    logger.debug('createdMessage:', createdMessage);
    return createdMessage;
  }
}
