import { AuthenticationUseCase } from '../../application/use-cases/AuthenticationUseCase';
import { AppointmentUseCase } from '../../application/use-cases/AppointmentUseCase';
import { NotificationUseCase } from '../../application/use-cases/NotificationUseCase';
import { AvailabilityUseCase } from '../../application/use-cases/AvailabilityUseCase';
import { SubscriptionPlanUseCase } from '../../application/use-cases/SubscriptionPlanUseCase';
import { DoctorUseCase } from '../../application/use-cases/DoctorUseCase';
import { PatientUseCase } from '../../application/use-cases/PatientUseCase';
import { ChatUseCase } from '../../application/use-cases/ChatUseCase';
import { ReviewUseCase } from '../../application/use-cases/ReviewUseCase';
import { ProfileUseCase } from '../../application/use-cases/ProfileUseCase';
import { ReportUseCase } from '../../application/use-cases/ReportUseCase';
import { SpecialityUseCase } from '../../application/use-cases/SpecialityUseCase';
import { UserUseCase } from '../../application/use-cases/UserUseCase';
import { authProviders } from './authProviders';

import {
  patientRepository,
  doctorRepository,
  adminRepository,
  appointmentRepository,
  availabilityRepository,
  patientSubscriptionRepository,
  subscriptionPlanRepository,
  specialityRepository,
  chatRepository,
  notificationRepository,
  reviewRepository,
  prescriptionRepository,
} from './repositories';

import {
  otpService,
  tokenService,
  emailService,
  stripeService,
  imageUploadService,
  socketService,
  notificationService,
  validatorService,
} from './services';

const createUseCases = () => ({
  authenticationUseCase: new AuthenticationUseCase(
    patientRepository,
    doctorRepository,
    adminRepository,
    otpService,
    tokenService,
    validatorService,
    authProviders
  ),
  appointmentUseCase: new AppointmentUseCase(
    appointmentRepository,
    availabilityRepository,
    patientSubscriptionRepository,
    notificationService,
    emailService,
    doctorRepository,
    patientRepository,
    imageUploadService,
    prescriptionRepository,
    validatorService
  ),
  notificationUseCase: new NotificationUseCase(notificationRepository, validatorService),
  availabilityUseCase: new AvailabilityUseCase(
    doctorRepository,
    availabilityRepository,
    appointmentRepository,
    emailService,
    patientRepository,
    validatorService
  ),
  subscriptionPlanUseCase: new SubscriptionPlanUseCase(
    subscriptionPlanRepository,
    patientSubscriptionRepository,
    patientRepository,
    doctorRepository,
    stripeService,
    notificationService,
    emailService,
    validatorService
  ),
  doctorUseCase: new DoctorUseCase(doctorRepository, specialityRepository, validatorService),
  patientUseCase: new PatientUseCase(
    patientRepository,
    patientSubscriptionRepository,
    validatorService,
    stripeService,
    appointmentRepository,
    subscriptionPlanRepository,
    doctorRepository
  ),
  chatUseCase: new ChatUseCase(
    chatRepository,
    patientRepository,
    doctorRepository,
    socketService,
    imageUploadService,
    validatorService
  ),
  reviewUseCase: new ReviewUseCase(reviewRepository, appointmentRepository, doctorRepository, validatorService),
  profileUseCase: new ProfileUseCase(
    doctorRepository,
    patientRepository,
    specialityRepository,
    imageUploadService,
    validatorService
  ),
  reportUseCase: new ReportUseCase(
    subscriptionPlanRepository,
    patientSubscriptionRepository,
    appointmentRepository,
    doctorRepository,
    patientRepository
  ),
  specialityUseCase: new SpecialityUseCase(specialityRepository, doctorRepository, validatorService),
  userUseCase: new UserUseCase(patientRepository, doctorRepository, adminRepository, validatorService),
});

export default createUseCases();
