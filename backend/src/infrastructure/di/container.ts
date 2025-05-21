import { PatientRepository } from '../repositories/PatientRepository';
import { DoctorRepository } from '../repositories/DoctorRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { OTPRepository } from '../repositories/OTPRepository';
import { EmailService } from '../services/EmailService';
import { OTPService } from '../services/OTPService';
import { TokenService } from '../services/TokenService';
import { UpdateDoctorUseCase } from '../../core/use-cases/admin/UpdateDoctorUseCase';
import { DeleteDoctorUseCase } from '../../core/use-cases/admin/DeleteDoctorUseCase';
import { BlockDoctorUseCase } from '../../core/use-cases/admin/BlockDoctorUseCase';
import { UpdatePatientUseCase } from '../../core/use-cases/admin/UpdatePatientUseCase';
import { DeletePatientUseCase } from '../../core/use-cases/admin/DeletePatientUseCase';
import { BlockPatientUseCase } from '../../core/use-cases/admin/BlockPatientUseCase';
import { ViewDoctorProfileUseCase } from '../../core/use-cases/profile/ViewDoctorProfile';
import { UpdateDoctorProfileUseCase } from '../../core/use-cases/profile/UpdateDoctorProfile';
import { ViewPatientProfileUseCase } from '../../core/use-cases/profile/ViewPatientProfile';
import { UpdatePatientProfileUseCase } from '../../core/use-cases/profile/UpdatePatientProfile';
import { CreateDoctorUseCase } from '../../core/use-cases/admin/CreateDoctorUseCase';
import { CreatePatientUseCase } from '../../core/use-cases/admin/CreatePatientUseCase';
import { AvailabilityRepository } from '../repositories/AvailabilityRepository';
import { SetAvailabilityUseCase } from '../../core/use-cases/doctor/SetAvailability';
import { GetAvailabilityUseCase } from '../../core/use-cases/doctor/GetAvailability';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { SubscriptionPlanRepository } from '../repositories/SubscriptionPlanRepository';
import { SubscribeToPlanUseCase } from '../../core/use-cases/patient/SubscribeToPlanUseCase';
import { CreateSubscriptionPlanUseCase } from '../../core/use-cases/doctor/CreateSubscriptionPlanUseCase';
import { ManageSubscriptionPlanUseCase } from '../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { CancelAppointmentUseCase } from '../../core/use-cases/patient/CancelAppointmentUseCase';
import { BookAppointmentUseCase } from '../../core/use-cases/patient/BookAppointment';
import { CheckFreeBookingUseCase } from '../../core/use-cases/patient/CheckFreeBookingUseCase';
import { GetDoctorAvailabilityUseCase } from '../../core/use-cases/patient/GetDoctorAvailability';
import { GetDoctorAppointmentsUseCase } from '../../core/use-cases/doctor/GetDoctorAppointmentUseCase';
import { GetAllAppointmentsUseCase } from '../../core/use-cases/admin/GetAllAppointmentsUseCase';
import { GetDoctorUseCase } from '../../core/use-cases/patient/GetDoctorUseCase';
import { GetVerifiedDoctorsUseCase } from '../../core/use-cases/patient/GetVerifiedDoctorsUseCase';
import { SignupPatientUseCase } from '../../core/use-cases/auth/patient/SignupPatientUseCase';
import { LoginPatientUseCase } from '../../core/use-cases/auth/patient/LoginPatientUseCase';
import { GoogleSignInPatientUseCase } from '../../core/use-cases/auth/patient/GoogleSignInPatientUseCase';
import { SignupDoctorUseCase } from '../../core/use-cases/auth/doctor/SignupDoctorUseCase';
import { LoginDoctorUseCase } from '../../core/use-cases/auth/doctor/LoginDoctorUseCase';
import { GoogleSignInDoctorUseCase } from '../../core/use-cases/auth/doctor/GoogleSignInDoctorUseCase';
import { LoginAdminUseCase } from '../../core/use-cases/auth/admin/LoginAdminUseCase';
import { RefreshTokenUseCase } from '../../core/use-cases/auth/shared/RefreshTokenUseCase';
import { LogoutUseCase } from '../../core/use-cases/auth/shared/LogoutUseCase';
import { ForgotPasswordUseCase } from '../../core/use-cases/auth/shared/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../core/use-cases/auth/shared/ResetPasswordUseCase';
import { VerifySignUpOTPUseCase } from '../../core/use-cases/auth/shared/VerifySignUpOTPUseCase';
import { GetCurrentUserUseCase } from '../../core/use-cases/user/GetCurrentUserUseCase';
import { ListPatientsUseCase } from '../../core/use-cases/admin/ListPatientsUseCase';
import { ListDoctorsUseCase } from '../../core/use-cases/admin/ListDoctorsUseCase';
import { VerifyDoctorUseCase } from '../../core/use-cases/admin/VerifyDoctorUseCase';
import { RemoveSlotUseCase } from '../../core/use-cases/doctor/RemoveSlotUseCase';
import { UpdateSlotUseCase } from '../../core/use-cases/doctor/UpdateSlotUseCase';
import { SpecialityRepository } from '../repositories/SpecialityRepository';
import { GetSpecialitiesUseCase } from '../../core/use-cases/admin/GetSpecialityUseCase';
import { AddSpecialityUseCase } from '../../core/use-cases/admin/AddSpecialityUseCase';
import { UpdateSpecialityUseCase } from '../../core/use-cases/admin/UpdateSpecialityUseCase';
import { DeleteSpecialityUseCase } from '../../core/use-cases/admin/DeleteSpecialityUseCase';
import { StripeService } from '../services/StripeService';
import { PatientSubscriptionRepository } from '../repositories/PatientSubscriptionRepositroy';
import { GetPatientSubscriptionsUseCase } from '../../core/use-cases/admin/GetpatientSubscriptions';
import { ConfirmSubscriptionUseCase } from '../../core/use-cases/patient/ConfirmSubscriptionUseCase';
import { ImageUploadService } from '../services/ImageUploadService';
import { ChatRepository } from '../repositories/ChatRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { VideoCallRepository } from '../repositories/VideoCallRepository';
import { SocketService } from '../services/SocketService';
import { NotificationService } from '../services/NotificationService';
import { VideoCallService } from '../services/VideoCallService';
import { SendMessageUseCase } from '../../core/use-cases/chat/SendMessageUseCase';
import { GetMessagesUseCase } from '../../core/use-cases/chat/GetMessagesUseCase';
import { DeleteMessageUseCase } from '../../core/use-cases/chat/DeleteMessageUseCase';
import { GetChatHistoryUseCase } from '../../core/use-cases/chat/GetChatHistoryUseCase';
import { GetInboxUseCase } from '../../core/use-cases/chat/GetInboxUseCase';
import { SendNotificationUseCase } from '../../core/use-cases/notification/SendNotificationUseCase';
import { GetNotificationsUseCase } from '../../core/use-cases/notification/GetNotificationsUseCase';
import { DeleteNotificationUseCase } from '../../core/use-cases/notification/DeleteNotificationUseCase';
import { InitiateVideoCallUseCase } from '../../core/use-cases/video-call/InitiateVideoCallUseCase';
import { EndVideoCallUseCase } from '../../core/use-cases/video-call/EndVideoCallUseCase';
import { UpdateVideoCallSettingsUseCase } from '../../core/use-cases/video-call/UpdateVideoCallSettingsUseCase';
import { ChatMessage } from '../../core/entities/ChatMessage';
import { IChatService } from '../../core/interfaces/services/IChatService';
import { QueryParams } from '../../types/authTypes';
import { DeleteAllNotificationsUseCase } from '../../core/use-cases/notification/DeleteAllNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '../../core/use-cases/notification/MarkNotificationAsReadUseCase';

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
    const videoCallRepository = new VideoCallRepository();

    // Initialize services
    const emailService = new EmailService();
    const tokenService = new TokenService();
    const otpService = new OTPService(otpRepository, emailService);
    const stripeService = new StripeService();
    const imageUploadService = new ImageUploadService();
    const videoCallService = new VideoCallService(videoCallRepository);
    const chatService = new (class implements IChatService {
      constructor(private container: Container) {}
      async sendMessage(message: ChatMessage): Promise<ChatMessage> {
        return await this.container.get<SendMessageUseCase>('SendMessageUseCase').execute(message);
      }
      async getMessages(senderId: string, receiverId: string, params: QueryParams): Promise<ChatMessage[]> {
        return this.container.get<GetMessagesUseCase>('GetMessagesUseCase').execute(senderId, receiverId, params);
      }
      async deleteMessage(messageId: string, userId: string): Promise<void> {
        await this.container.get<DeleteMessageUseCase>('DeleteMessageUseCase').execute(messageId, userId);
      }
      async getChatHistory(userId: string, params: QueryParams): Promise<ChatMessage[]> {
        return this.container.get<GetChatHistoryUseCase>('GetChatHistoryUseCase').execute(userId, params);
      }
    })(this);
    const socketService = new SocketService(chatService, videoCallService, tokenService);
    const notificationService = new NotificationService(notificationRepository, socketService);
    socketService.setNotificationService(notificationService);

    // Register services
    this.dependencies.set('IEmailService', emailService);
    this.dependencies.set('ITokenService', tokenService);
    this.dependencies.set('IOTPService', otpService);
    this.dependencies.set('StripeService', stripeService);
    this.dependencies.set('ImageUploadService', imageUploadService);
    this.dependencies.set('SocketService', socketService);
    this.dependencies.set('INotificationService', notificationService);
    this.dependencies.set('IVideoCallService', videoCallService);

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
    this.dependencies.set('IVideoCallRepository', videoCallRepository);

    // Initialize and register use cases
    this.dependencies.set('SignupPatientUseCase', new SignupPatientUseCase(patientRepository, otpService));
    this.dependencies.set('LoginPatientUseCase', new LoginPatientUseCase(patientRepository, tokenService));
    this.dependencies.set(
      'GoogleSignInPatientUseCase',
      new GoogleSignInPatientUseCase(patientRepository, tokenService)
    );
    this.dependencies.set('SignupDoctorUseCase', new SignupDoctorUseCase(doctorRepository, otpService));
    this.dependencies.set('LoginDoctorUseCase', new LoginDoctorUseCase(doctorRepository, tokenService));
    this.dependencies.set('GoogleSignInDoctorUseCase', new GoogleSignInDoctorUseCase(doctorRepository, tokenService));
    this.dependencies.set('LoginAdminUseCase', new LoginAdminUseCase(adminRepository, tokenService));
    this.dependencies.set(
      'RefreshTokenUseCase',
      new RefreshTokenUseCase(patientRepository, doctorRepository, adminRepository, tokenService)
    );
    this.dependencies.set('LogoutUseCase', new LogoutUseCase(patientRepository, doctorRepository, adminRepository));
    this.dependencies.set(
      'ForgotPasswordUseCase',
      new ForgotPasswordUseCase(patientRepository, doctorRepository, adminRepository, otpService)
    );
    this.dependencies.set(
      'ResetPasswordUseCase',
      new ResetPasswordUseCase(patientRepository, doctorRepository, adminRepository, otpService)
    );
    this.dependencies.set(
      'VerifySignUpOTPUseCase',
      new VerifySignUpOTPUseCase(patientRepository, doctorRepository, otpService, tokenService)
    );
    this.dependencies.set(
      'GetCurrentUserUseCase',
      new GetCurrentUserUseCase(patientRepository, doctorRepository, adminRepository)
    );
    this.dependencies.set('CreateDoctorUseCase', new CreateDoctorUseCase(doctorRepository));
    this.dependencies.set('ListPatientsUseCase', new ListPatientsUseCase(patientRepository));
    this.dependencies.set('ListDoctorsUseCase', new ListDoctorsUseCase(doctorRepository));
    this.dependencies.set('VerifyDoctorUseCase', new VerifyDoctorUseCase(doctorRepository));
    this.dependencies.set('UpdateDoctorUseCase', new UpdateDoctorUseCase(doctorRepository, specialityRepository));
    this.dependencies.set('DeleteDoctorUseCase', new DeleteDoctorUseCase(doctorRepository));
    this.dependencies.set('BlockDoctorUseCase', new BlockDoctorUseCase(doctorRepository));
    this.dependencies.set('UpdatePatientUseCase', new UpdatePatientUseCase(patientRepository));
    this.dependencies.set('DeletePatientUseCase', new DeletePatientUseCase(patientRepository));
    this.dependencies.set('BlockPatientUseCase', new BlockPatientUseCase(patientRepository));
    this.dependencies.set('CreatePatientUseCase', new CreatePatientUseCase(patientRepository));
    this.dependencies.set('ViewDoctorProfileUseCase', new ViewDoctorProfileUseCase(doctorRepository));
    this.dependencies.set(
      'UpdateDoctorProfileUseCase',
      new UpdateDoctorProfileUseCase(doctorRepository, imageUploadService)
    );
    this.dependencies.set('ViewPatientProfileUseCase', new ViewPatientProfileUseCase(patientRepository));
    this.dependencies.set(
      'UpdatePatientProfileUseCase',
      new UpdatePatientProfileUseCase(patientRepository, imageUploadService)
    );
    this.dependencies.set(
      'SetAvailabilityUseCase',
      new SetAvailabilityUseCase(doctorRepository, availabilityRepository)
    );
    this.dependencies.set('GetAvailabilityUseCase', new GetAvailabilityUseCase(availabilityRepository));
    this.dependencies.set('RemoveSlotUseCase', new RemoveSlotUseCase(availabilityRepository, appointmentRepository));
    this.dependencies.set('UpdateSlotUseCase', new UpdateSlotUseCase(availabilityRepository, appointmentRepository));
    this.dependencies.set(
      'CheckFreeBookingUseCase',
      new CheckFreeBookingUseCase(doctorRepository, patientSubscriptionRepository, appointmentRepository)
    );
    this.dependencies.set(
      'BookAppointmentUseCase',
      new BookAppointmentUseCase(
        appointmentRepository,
        availabilityRepository,
        doctorRepository,
        patientRepository,
        patientSubscriptionRepository,
        this.dependencies.get('CheckFreeBookingUseCase') as CheckFreeBookingUseCase,
        notificationService
      )
    );
    this.dependencies.set(
      'GetDoctorAvailabilityUseCase',
      new GetDoctorAvailabilityUseCase(availabilityRepository, doctorRepository)
    );
    this.dependencies.set(
      'CreateSubscriptionPlanUseCase',
      new CreateSubscriptionPlanUseCase(subscriptionPlanRepository, doctorRepository)
    );
    this.dependencies.set(
      'SubscribeToPlanUseCase',
      new SubscribeToPlanUseCase(
        subscriptionPlanRepository,
        patientSubscriptionRepository,
        patientRepository,
        stripeService
      )
    );
    this.dependencies.set(
      'ConfirmSubscriptionUseCase',
      new ConfirmSubscriptionUseCase(
        subscriptionPlanRepository,
        patientSubscriptionRepository,
        patientRepository,
        stripeService,
        notificationService
      )
    );
    this.dependencies.set(
      'ManageSubscriptionPlanUseCase',
      new ManageSubscriptionPlanUseCase(subscriptionPlanRepository, doctorRepository)
    );
    this.dependencies.set(
      'CancelAppointmentUseCase',
      new CancelAppointmentUseCase(
        appointmentRepository,
        availabilityRepository,
        patientSubscriptionRepository,
        notificationService
      )
    );
    this.dependencies.set('GetDoctorAppointmentsUseCase', new GetDoctorAppointmentsUseCase(appointmentRepository));
    this.dependencies.set('GetAllAppointmentsUseCase', new GetAllAppointmentsUseCase(appointmentRepository));
    this.dependencies.set('GetDoctorUseCase', new GetDoctorUseCase(doctorRepository));
    this.dependencies.set('GetVerifiedDoctorsUseCase', new GetVerifiedDoctorsUseCase(doctorRepository));
    this.dependencies.set('GetSpecialitiesUseCase', new GetSpecialitiesUseCase(specialityRepository));
    this.dependencies.set('AddSpecialityUseCase', new AddSpecialityUseCase(specialityRepository));
    this.dependencies.set('UpdateSpecialityUseCase', new UpdateSpecialityUseCase(specialityRepository));
    this.dependencies.set(
      'DeleteSpecialityUseCase',
      new DeleteSpecialityUseCase(specialityRepository, doctorRepository)
    );
    this.dependencies.set(
      'GetPatientSubscriptionsUseCase',
      new GetPatientSubscriptionsUseCase(patientSubscriptionRepository)
    );
    this.dependencies.set(
      'AdminCancelAppointmentUseCase',
      new CancelAppointmentUseCase(
        appointmentRepository,
        availabilityRepository,
        patientSubscriptionRepository,
        notificationService
      )
    );
    this.dependencies.set('SendMessageUseCase', new SendMessageUseCase(chatRepository, patientSubscriptionRepository));
    this.dependencies.set('GetMessagesUseCase', new GetMessagesUseCase(chatRepository));
    this.dependencies.set('DeleteMessageUseCase', new DeleteMessageUseCase(chatRepository));
    this.dependencies.set('GetChatHistoryUseCase', new GetChatHistoryUseCase(chatRepository));
    this.dependencies.set('GetInboxUseCase', new GetInboxUseCase(chatRepository, patientRepository, doctorRepository));
    this.dependencies.set('SendNotificationUseCase', new SendNotificationUseCase(notificationRepository));
    this.dependencies.set('GetNotificationsUseCase', new GetNotificationsUseCase(notificationRepository));
    this.dependencies.set('DeleteNotificationUseCase', new DeleteNotificationUseCase(notificationRepository));
    this.dependencies.set('DeleteAllNotificationsUseCase', new DeleteAllNotificationsUseCase(notificationRepository));
    this.dependencies.set('MarkNotificationAsReadUseCase', new MarkNotificationAsReadUseCase(notificationRepository));
    this.dependencies.set(
      'InitiateVideoCallUseCase',
      new InitiateVideoCallUseCase(videoCallRepository, appointmentRepository)
    );
    this.dependencies.set('EndVideoCallUseCase', new EndVideoCallUseCase(videoCallRepository));
    this.dependencies.set('UpdateVideoCallSettingsUseCase', new UpdateVideoCallSettingsUseCase(videoCallRepository));
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
