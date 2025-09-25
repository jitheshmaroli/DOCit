import { AdminController } from '../../presentation/controllers/admin/AdminController';
import { AdminAuthController } from '../../presentation/controllers/auth/AdminAuthController';
import { DoctorAuthController } from '../../presentation/controllers/auth/DoctorAuthController';
import { PatientAuthController } from '../../presentation/controllers/auth/PatientAuthController';
import { SharedAuthController } from '../../presentation/controllers/auth/SharedAuthController';
import { ChatController } from '../../presentation/controllers/chat/ChatController';
import { DoctorController } from '../../presentation/controllers/doctor/DoctorController';
import { DoctorProfileController } from '../../presentation/controllers/doctor/DoctorProfileController';
import { NotificationController } from '../../presentation/controllers/notification/NotificationController';
import { OTPController } from '../../presentation/controllers/otp/OTPController';
import { PatientController } from '../../presentation/controllers/patient/PatientController';
import { PatientProfileController } from '../../presentation/controllers/patient/PatientProfileController';
import { UserController } from '../../presentation/controllers/user/UserController';
import { otpService, socketService } from './services';

import createUseCase from './useCases';
const {
  subscriptionPlanUseCase,
  specialityUseCase,
  reportUseCase,
  appointmentUseCase,
  availabilityUseCase,
  patientUseCase,
  authenticationUseCase,
  reviewUseCase,
  profileUseCase,
  userUseCase,
  doctorUseCase,
  chatUseCase,
  notificationUseCase,
} = createUseCase;

const createControllers = () => {
  return {
    adminController: new AdminController(
      subscriptionPlanUseCase,
      appointmentUseCase,
      specialityUseCase,
      reportUseCase,
      patientUseCase
    ),
    adminAuthController: new AdminAuthController(authenticationUseCase, doctorUseCase, patientUseCase),
    doctorController: new DoctorController(
      subscriptionPlanUseCase,
      specialityUseCase,
      reportUseCase,
      appointmentUseCase,
      availabilityUseCase,
      patientUseCase
    ),
    doctorAuthController: new DoctorAuthController(authenticationUseCase),
    patientAuthController: new PatientAuthController(authenticationUseCase),
    sharedAuthController: new SharedAuthController(authenticationUseCase),
    chatController: new ChatController(chatUseCase, socketService),
    doctorProfileController: new DoctorProfileController(profileUseCase, specialityUseCase),
    notificationController: new NotificationController(notificationUseCase),
    otpController: new OTPController(otpService),
    patientController: new PatientController(
      patientUseCase,
      subscriptionPlanUseCase,
      specialityUseCase,
      appointmentUseCase,
      reviewUseCase,
      availabilityUseCase,
      doctorUseCase
    ),
    patientProfileController: new PatientProfileController(profileUseCase),
    userController: new UserController(userUseCase),
  };
};

export default createControllers;
