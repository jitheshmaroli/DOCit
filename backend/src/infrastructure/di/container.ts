import { AppointmentUseCase } from '../../application/use-cases/AppointmentUseCase';
import { NotificationUseCase } from '../../application/use-cases/NotificationUseCase';
import { AvailabilityUseCase } from '../../application/use-cases/AvailabilityUseCase';
import { SubscriptionPlanUseCase } from '../../application/use-cases/SubscriptionPlanUseCase';
import { DoctorUseCase } from '../../application/use-cases/DoctorUseCase';
import { PatientUseCase } from '../../application/use-cases/PatientUseCase';
import { ChatUseCase } from '../../application/use-cases/ChatUseCase';
import { ReviewUseCase } from '../../application/use-cases/ReviewUseCase';
import { ProfileUseCase } from '../../application/use-cases/ProfileUseCase';
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
import { AuthenticationUseCase } from '../../application/use-cases/AuthenticationUseCase';
import { PatientSubscriptionRepository } from '../repositories/PatientSubscriptionRepositroy';
import { ReportUseCase } from '../../application/use-cases/ReportUseCase';
import { SpecialityUseCase } from '../../application/use-cases/SpecialityUseCase';
import { UserUseCase } from '../../application/use-cases/UserUseCase';
import { PrescriptionRepository } from '../repositories/PrescriptionRepository';

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
    const prescriptionRepository = new PrescriptionRepository();

    // Initialize services
    const emailService = new EmailService();
    const tokenService = new TokenService();
    const otpService = new OTPService(otpRepository, emailService);
    const stripeService = new StripeService();
    const imageUploadService = new ImageUploadService();
    const socketService = new SocketService(
      chatRepository,
      tokenService,
      patientRepository,
      doctorRepository,
      notificationRepository
    );
    const notificationService = new NotificationService(notificationRepository, socketService);

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
    this.dependencies.set('IPrescriptionRepository', prescriptionRepository);

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
        patientRepository,
        imageUploadService,
        prescriptionRepository
      )
    );
    this.dependencies.set('INotificationUseCase', new NotificationUseCase(notificationRepository));
    this.dependencies.set(
      'IAvailabilityUseCase',
      new AvailabilityUseCase(
        doctorRepository,
        availabilityRepository,
        appointmentRepository,
        emailService,
        patientRepository
      )
    );
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
    this.dependencies.set(
      'IPatientUseCase',
      new PatientUseCase(patientRepository, patientSubscriptionRepository, appointmentRepository)
    );
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
