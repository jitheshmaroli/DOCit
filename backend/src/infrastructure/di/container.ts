import { PatientRepository } from '../repositories/PatientRepository';
import { DoctorRepository } from '../repositories/DoctorRepository';
import { AdminRepository } from '../repositories/AdminRepository';
import { OTPRepository } from '../repositories/OTPRepository';
import { EmailService } from '../services/EmailService';
import { OTPService } from '../services/OTPService';
import { TokenService } from '../services/TokenService';
import { SignupPatientUseCase } from '../../core/use-cases/auth/patient/signupPatient';
import { LoginPatientUseCase } from '../../core/use-cases/auth/patient/loginPatient';
import { GoogleSignInPatientUseCase } from '../../core/use-cases/auth/patient/googleSignInPatient';
import { SignupDoctorUseCase } from '../../core/use-cases/auth/doctor/signupDoctor';
import { LoginDoctorUseCase } from '../../core/use-cases/auth/doctor/loginDoctor';
import { LoginAdminUseCase } from '../../core/use-cases/auth/admin/loginAdmin';
import { RefreshTokenUseCase } from '../../core/use-cases/auth/shared/refreshToken';
import { LogoutUseCase } from '../../core/use-cases/auth/shared/logout';
import { ForgotPasswordUseCase } from '../../core/use-cases/auth/shared/forgotPassword';
import { ResetPasswordUseCase } from '../../core/use-cases/auth/shared/resetPassword';
import { VerifySignUpOTPUseCase } from '../../core/use-cases/auth/shared/verifySignUpOTP';
import { GetCurrentUserUseCase } from '../../core/use-cases/user/getCurrentUser';
import { GoogleSignInDoctorUseCase } from '../../core/use-cases/auth/doctor/googleSignInDoctor';
import { UpdateDoctorUseCase } from '../../core/use-cases/admin/UpdateDoctor';
import { DeleteDoctorUseCase } from '../../core/use-cases/admin/DeleteDoctor';
import { BlockDoctorUseCase } from '../../core/use-cases/admin/BlockDoctor';
import { UpdatePatientUseCase } from '../../core/use-cases/admin/UpdatePatient';
import { DeletePatientUseCase } from '../../core/use-cases/admin/DeletePatient';
import { BlockPatientUseCase } from '../../core/use-cases/admin/BlockPatient';
import { ViewDoctorProfileUseCase } from '../../core/use-cases/profile/ViewDoctorProfile';
import { UpdateDoctorProfileUseCase } from '../../core/use-cases/profile/UpdateDoctorProfile';
import { ViewPatientProfileUseCase } from '../../core/use-cases/profile/ViewPatientProfile';
import { UpdatePatientProfileUseCase } from '../../core/use-cases/profile/UpdatePatientProfile';
import { CreateDoctorUseCase } from '../../core/use-cases/admin/CreateDoctor';
import { ListPatientsUseCase } from '../../core/use-cases/admin/listPatients';
import { ListDoctorsUseCase } from '../../core/use-cases/admin/listDoctors';
import { ListVerifiedDoctorsUseCase } from '../../core/use-cases/admin/listVerifiedDoctors';
import { VerifyDoctorUseCase } from '../../core/use-cases/admin/verifyDoctor';
import { CreatePatientUseCase } from '../../core/use-cases/admin/CreatePatient';
import { AvailabilityRepository } from '../repositories/AvailabilityRepository';
import { SetAvailabilityUseCase } from '../../core/use-cases/doctor/SetAvailability';
import { GetAvailabilityUseCase } from '../../core/use-cases/doctor/GetAvailability';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { SubscriptionPlanRepository } from '../repositories/SubscriptionPlanRepository';
import { SubscribeToPlanUseCase } from '../../core/use-cases/patient/SubscribeToPlanUseCase';
import { CreateSubscriptionPlanUseCase } from '../../core/use-cases/doctor/CreateSubscriptionPlanUseCase';
import { ManageSubscriptionPlanUseCase } from '../../core/use-cases/admin/ManageSubscriptionPlanUseCase';
import { CancelAppointmentUseCase } from '../../core/use-cases/patient/CancelAppointmentUseCase';
import { PatientSubscriptionRepository } from '../repositories/PatientSubscriptionRepositroy';
import { BookAppointmentUseCase } from '../../core/use-cases/patient/BookAppointment';
import { GetDoctorAvailabilityUseCase } from '../../core/use-cases/patient/GetDoctorAvailability';
import { GetDoctorAppointmentsUseCase } from '../../core/use-cases/doctor/GetDoctorAppointmentUseCase';
import { GetAllAppointmentsUseCase } from '../../core/use-cases/admin/GetAllAppointmentsUseCase';

export class Container {
  private static instance: Container;
  private dependencies: Map<string, any> = new Map();

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

    // Initialize services
    const emailService = new EmailService();
    const tokenService = new TokenService();
    const otpService = new OTPService(otpRepository, emailService);

    // Register repositories
    this.dependencies.set('IPatientRepository', patientRepository);
    this.dependencies.set('IDoctorRepository', doctorRepository);
    this.dependencies.set('IAdminRepository', adminRepository);
    this.dependencies.set('IOTPRepository', otpRepository);
    this.dependencies.set('IAvailabilityRepository', availabilityRepository);
    this.dependencies.set('ISubscriptionPlanRepository', subscriptionPlanRepository);
    this.dependencies.set('IPatientSubscriptionRepository', patientSubscriptionRepository);
    this.dependencies.set('IAppointmentRepository', appointmentRepository);

    // Register services
    this.dependencies.set('IEmailService', emailService);
    this.dependencies.set('ITokenService', tokenService);
    this.dependencies.set('IOTPService', otpService);

    // Initialize and register use cases
    this.dependencies.set(
      'SignupPatientUseCase',
      new SignupPatientUseCase(patientRepository, otpService)
    );
    this.dependencies.set(
      'LoginPatientUseCase',
      new LoginPatientUseCase(patientRepository, tokenService)
    );
    this.dependencies.set(
      'GoogleSignInPatientUseCase',
      new GoogleSignInPatientUseCase(patientRepository, tokenService)
    );
    this.dependencies.set(
      'SignupDoctorUseCase',
      new SignupDoctorUseCase(doctorRepository, otpService)
    );
    this.dependencies.set(
      'LoginDoctorUseCase',
      new LoginDoctorUseCase(doctorRepository, tokenService)
    );
    this.dependencies.set(
      'GoogleSignInDoctorUseCase',
      new GoogleSignInDoctorUseCase(doctorRepository, tokenService)
    );
    this.dependencies.set(
      'LoginAdminUseCase',
      new LoginAdminUseCase(adminRepository, tokenService)
    );
    this.dependencies.set(
      'RefreshTokenUseCase',
      new RefreshTokenUseCase(
        patientRepository,
        doctorRepository,
        adminRepository,
        tokenService
      )
    );
    this.dependencies.set(
      'LogoutUseCase',
      new LogoutUseCase(patientRepository, doctorRepository, adminRepository)
    );
    this.dependencies.set(
      'ForgotPasswordUseCase',
      new ForgotPasswordUseCase(
        patientRepository,
        doctorRepository,
        adminRepository,
        otpService
      )
    );
    this.dependencies.set(
      'ResetPasswordUseCase',
      new ResetPasswordUseCase(
        patientRepository,
        doctorRepository,
        adminRepository,
        otpService
      )
    );
    this.dependencies.set(
      'VerifySignUpOTPUseCase',
      new VerifySignUpOTPUseCase(
        patientRepository,
        doctorRepository,
        otpService,
        tokenService
      )
    );
    this.dependencies.set(
      'GetCurrentUserUseCase',
      new GetCurrentUserUseCase(
        patientRepository,
        doctorRepository,
        adminRepository
      )
    );
    this.dependencies.set(
      'CreateDoctorUseCase',
      new CreateDoctorUseCase(doctorRepository)
    );
    this.dependencies.set(
      'ListPatientsUseCase',
      new ListPatientsUseCase(patientRepository)
    );
    this.dependencies.set(
      'ListDoctorsUseCase',
      new ListDoctorsUseCase(doctorRepository)
    );
    this.dependencies.set(
      'ListVerifiedDoctorsUseCase',
      new ListVerifiedDoctorsUseCase(doctorRepository)
    );
    this.dependencies.set(
      'VerifyDoctorUseCase',
      new VerifyDoctorUseCase(doctorRepository)
    );
    this.dependencies.set(
      'UpdateDoctorUseCase',
      new UpdateDoctorUseCase(doctorRepository)
    );
    this.dependencies.set(
      'DeleteDoctorUseCase',
      new DeleteDoctorUseCase(doctorRepository)
    );
    this.dependencies.set(
      'BlockDoctorUseCase',
      new BlockDoctorUseCase(doctorRepository)
    );
    this.dependencies.set(
      'UpdatePatientUseCase',
      new UpdatePatientUseCase(patientRepository)
    );
    this.dependencies.set(
      'DeletePatientUseCase',
      new DeletePatientUseCase(patientRepository)
    );
    this.dependencies.set(
      'BlockPatientUseCase',
      new BlockPatientUseCase(patientRepository)
    );
    this.dependencies.set(
      'CreatePatientUseCase',
      new CreatePatientUseCase(patientRepository)
    );
    this.dependencies.set(
      'ViewDoctorProfileUseCase',
      new ViewDoctorProfileUseCase(doctorRepository)
    );
    this.dependencies.set(
      'UpdateDoctorProfileUseCase',
      new UpdateDoctorProfileUseCase(doctorRepository)
    );
    this.dependencies.set(
      'ViewPatientProfileUseCase',
      new ViewPatientProfileUseCase(patientRepository)
    );
    this.dependencies.set(
      'UpdatePatientProfileUseCase',
      new UpdatePatientProfileUseCase(patientRepository)
    );
    this.dependencies.set(
      'SetAvailabilityUseCase',
      new SetAvailabilityUseCase(doctorRepository, availabilityRepository)
    );
    this.dependencies.set(
      'GetAvailabilityUseCase',
      new GetAvailabilityUseCase(availabilityRepository)
    );
    this.dependencies.set(
      'BookAppointmentUseCase',
      new BookAppointmentUseCase(
        appointmentRepository,
        availabilityRepository,
        doctorRepository,
        patientSubscriptionRepository
      )
    );
    this.dependencies.set(
      'GetDoctorAvailabilityUseCase',
      new GetDoctorAvailabilityUseCase(availabilityRepository, doctorRepository)
    );
    this.dependencies.set(
      'CreateSubscriptionPlanUseCase',
      new CreateSubscriptionPlanUseCase(
        subscriptionPlanRepository,
        doctorRepository
      )
    );
    this.dependencies.set(
      'SubscribeToPlanUseCase',
      new SubscribeToPlanUseCase(
        subscriptionPlanRepository,
        patientSubscriptionRepository
      )
    );
    this.dependencies.set(
      'ManageSubscriptionPlanUseCase',
      new ManageSubscriptionPlanUseCase(subscriptionPlanRepository)
    );
    this.dependencies.set(
      'CancelAppointmentUseCase',
      new CancelAppointmentUseCase(appointmentRepository)
    );
    // New use cases
    this.dependencies.set(
      'GetDoctorAppointmentsUseCase',
      new GetDoctorAppointmentsUseCase(appointmentRepository)
    );
    this.dependencies.set(
      'GetAllAppointmentsUseCase',
      new GetAllAppointmentsUseCase(appointmentRepository)
    );
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