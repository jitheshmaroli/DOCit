import { ChatMessage } from '../../entities/ChatMessage';
import { IChatRepository } from '../../interfaces/repositories/IChatRepository';
import { IPatientSubscriptionRepository } from '../../interfaces/repositories/IPatientSubscriptionRepository';
import { IImageUploadService } from '../../interfaces/services/IImageUploadService';

export class SendMessageUseCase {
  constructor(
    private chatRepository: IChatRepository,
    private patientSubscriptionRepository: IPatientSubscriptionRepository,
    private imageUploadService?: IImageUploadService
  ) {}

  async execute(message: ChatMessage, file?: Express.Multer.File): Promise<ChatMessage> {
    let attachment: ChatMessage['attachment'] | undefined;
    if (file && this.imageUploadService) {
      const { url } = await this.imageUploadService.uploadFile(file, 'chat_attachments');
      attachment = {
        url,
        type: file.mimetype,
        name: file.originalname,
      };
    }

    const createdMessage = await this.chatRepository.create({
      ...message,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachment,
      unreadBy: [message.receiverId],
    });
    return createdMessage;
  }
}
