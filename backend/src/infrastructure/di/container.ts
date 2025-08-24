import { IChatUseCase } from '../../core/interfaces/use-cases/IChatUseCase';
import { AppointmentUseCase } from '../../core/use-cases/AppointmentUseCase';
import { NotificationUseCase } from '../../core/use-cases/NotificationUseCase';
import { AvailabilityUseCase } from '../../core/use-cases/AvailabilityUseCase';
import { SubscriptionPlanUseCase } from '../../core/use-cases/SubscriptionPlanUseCase';
import { DoctorUseCase } from '../../core/use-cases/DoctorUseCase';
import { PatientUseCase } from '../../core/use-cases/PatientUseCase';
import { ChatUseCase } from '../../core/use-cases/ChatUseCase';
import { ReviewUseCase } from '../../core/use-cases/ReviewUseCase';
import { ProfileUseCase } from '../../core/use-cases/ProfileUseCase';
import { PatientRepository } from '../repositories/PatientRepository';
import { DoctorRepository } from '../repositories/DoctorRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { OTPRepository } from '../repositories/OTPRepository';
import { EmailService } from '../services/EmailService';
import { OTPService } from '../services/OTPService';
import { TokenService } from '../services/TokenService';
import { AvailabilityRepository } from '../repositories/AvailabilityRepository';
import { SubscriptionPlanRepository } from '../repositories/SubscriptionPlanRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { SpecialityRepository } from '../repositories/SpecialityRepository';
import { StripeService } from '../services/StripeService';
import { ImageUploadService } from '../services/ImageUploadService';
import { ChatRepository } from '../repositories/ChatRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { SocketService } from '../services/SocketService';
import { NotificationService } from '../services/NotificationService';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { IChatService } from '../../core/interfaces/services/IChatService';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { QueryParams } from '../../types/authTypes';
import { AuthenticationUseCase } from '../../core/use-cases/AuthenticationUseCase';
import { PatientSubscriptionRepository } from '../repositories/PatientSubscriptionRepositroy';
import { ReportUseCase } from '../../core/use-cases/ReportUseCase';
import { SpecialityUseCase } from '../../core/use-cases/SpecialityUseCase';
import { UserUseCase } from '../../core/use-cases/UserUseCase';
import { ChatMapper } from '../../core/interfaces/mappers/ChatMapper';
import { SendMessageRequestDTO, ChatMessageResponseDTO } from '../../core/interfaces/ChatDTOs';

export class Container {
  private static instance: Container;
  private dependencies: Map<string, unknown> = new Map();

  private constructor() {
    // Initialize repositories
    const patientRepository = new PatientRepository();
    const doctorRepository = new DoctorRepository();
    const adminRepository = new AdminRepository();
    const otpRepository = new OTPRepository();
    const availabilityRepository = new AvailabilityRepository();
    const subscriptionPlanRepository = new SubscriptionPlanRepository();
    const patientSubscriptionRepository = new PatientSubscriptionRepository();
    const appointmentRepository = new AppointmentRepository();
    const specialityRepository = new SpecialityRepository();
    const chatRepository = new ChatRepository();
    const notificationRepository = new NotificationRepository();
    const reviewRepository = new ReviewRepository();

    // Initialize services
    const emailService = new EmailService();
    const tokenService = new TokenService();
    const otpService = new OTPService(otpRepository, emailService);
    const stripeService = new StripeService();
    const imageUploadService = new ImageUploadService();
    const chatService = new (class implements IChatService {
      constructor(private container: Container) {}
      async sendMessage(message: ChatMessage, file?: Express.Multer.File): Promise<ChatMessage> {
        const dto: SendMessageRequestDTO = {
          receiverId: message.receiverId,
          message: message.message,
          senderName: message.senderName ?? 'Unknown', // Default senderName to avoid undefined
        };
        const chatMessageDTO: ChatMessageResponseDTO = await this.container
          .get<IChatUseCase>('IChatUseCase')
          .sendMessage(dto, file);
        return ChatMapper.toChatMessageEntityFromResponse(chatMessageDTO);
      }
      async getMessages(senderId: string, receiverId: string): Promise<ChatMessage[]> {
        const messagesDTO: ChatMessageResponseDTO[] = await this.container
          .get<IChatUseCase>('IChatUseCase')
          .getMessages(senderId, receiverId);
        return messagesDTO.map(ChatMapper.toChatMessageEntityFromResponse);
      }
      async deleteMessage(messageId: string, userId: string): Promise<void> {
        await this.container.get<IChatUseCase>('IChatUseCase').deleteMessage(messageId, userId);
      }
      async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]> {
        const historyDTO: ChatMessageResponseDTO[] = await this.container
          .get<IChatUseCase>('IChatUseCase')
          .getChatHistory(userId, params);
        return historyDTO.map(ChatMapper.toChatMessageEntityFromResponse);
      }
    })(this);
    const socketService = new SocketService(chatService, tokenService, patientRepository, doctorRepository);
    const notificationService = new NotificationService(notificationRepository, socketService);
    socketService.setNotificationService(notificationService);

    // Register services
    this.dependencies.set('IEmailService', emailService);
    this.dependencies.set('ITokenService', tokenService);
    this.dependencies.set('IOTPService', otpService);
    this.dependencies.set('IPaymentService', stripeService);
    this.dependencies.set('IImageUploadService', imageUploadService);
    this.dependencies.set('SocketService', socketService);
    this.dependencies.set('INotificationService', notificationService);

    // Register repositories
    this.dependencies.set('IPatientRepository', patientRepository);
    this.dependencies.set('IDoctorRepository', doctorRepository);
    this.dependencies.set('IAdminRepository', adminRepository);
    this.dependencies.set('IOTPRepository', otpRepository);
    this.dependencies.set('IAvailabilityRepository', availabilityRepository);
    this.dependencies.set('ISubscriptionPlanRepository', subscriptionPlanRepository);
    this.dependencies.set('IPatientSubscriptionRepository', patientSubscriptionRepository);
    this.dependencies.set('IAppointmentRepository', appointmentRepository);
    this.dependencies.set('ISpecialityRepository', specialityRepository);
    this.dependencies.set('IChatRepository', chatRepository);
    this.dependencies.set('INotificationRepository', notificationRepository);
    this.dependencies.set('IReviewRepository', reviewRepository);

    // Register use cases
    this.dependencies.set(
      'IAuthenticationUseCase',
      new AuthenticationUseCase(patientRepository, doctorRepository, adminRepository, otpService, tokenService)
    );
    this.dependencies.set(
      'IAppointmentUseCase',
      new AppointmentUseCase(
        appointmentRepository,
        availabilityRepository,
        patientSubscriptionRepository,
        notificationService,
        emailService,
        doctorRepository,
        patientRepository
      )
    );
    this.dependencies.set('INotificationUseCase', new NotificationUseCase(notificationRepository));
    this.dependencies.set('IAvailabilityUseCase', new AvailabilityUseCase(doctorRepository, availabilityRepository));
    this.dependencies.set(
      'ISubscriptionPlanUseCase',
      new SubscriptionPlanUseCase(
        subscriptionPlanRepository,
        patientSubscriptionRepository,
        patientRepository,
        doctorRepository,
        stripeService,
        notificationService,
        emailService
      )
    );
    this.dependencies.set('IDoctorUseCase', new DoctorUseCase(doctorRepository, specialityRepository));
    this.dependencies.set('IPatientUseCase', new PatientUseCase(patientRepository, patientSubscriptionRepository));
    this.dependencies.set(
      'IChatUseCase',
      new ChatUseCase(chatRepository, patientRepository, doctorRepository, socketService, imageUploadService)
    );
    this.dependencies.set(
      'IReviewUseCase',
      new ReviewUseCase(reviewRepository, appointmentRepository, doctorRepository)
    );
    this.dependencies.set(
      'IProfileUseCase',
      new ProfileUseCase(doctorRepository, patientRepository, specialityRepository, imageUploadService)
    );
    this.dependencies.set(
      'IReportUseCase',
      new ReportUseCase(
        subscriptionPlanRepository,
        patientSubscriptionRepository,
        appointmentRepository,
        doctorRepository,
        patientRepository
      )
    );
    this.dependencies.set('ISpecialityUseCase', new SpecialityUseCase(specialityRepository, doctorRepository));
    this.dependencies.set('IUserUseCase', new UserUseCase(patientRepository, doctorRepository, adminRepository));
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  get<T>(key: string): T {
    const dependency = this.dependencies.get(key);
    if (!dependency) {
      throw new Error(`Dependency ${key} not found in container`);
    }
    return dependency as T;
  }
}
