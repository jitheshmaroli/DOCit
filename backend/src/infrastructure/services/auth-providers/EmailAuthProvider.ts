import { IAuthProvider } from '../../../core/interfaces/services/IAuthProvider';
import { IPatientRepository } from '../../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../core/interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../core/interfaces/repositories/IAdminRepository';
import { IValidatorService } from '../../../core/interfaces/services/IValidatorService';
import { UserRole } from '../../../types';
import { AuthenticationError, NotFoundError, ValidationError } from '../../../utils/errors';
import bcrypt from 'bcrypt';
import { AuthProviderData } from '../../../types/authTypes';
import { Patient } from '../../../core/entities/Patient';
import { Doctor } from '../../../core/entities/Doctor';
import { Admin } from '../../../core/entities/Admin';

export class EmailAuthProvider implements IAuthProvider {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository,
    private validatorService: IValidatorService
  ) {}

  async authenticate(role: UserRole, data: AuthProviderData): Promise<Patient | Doctor | Admin> {
    if (!('email' in data && 'password' in data)) {
      throw new ValidationError('Email and password required');
    }
    this.validatorService.validateRequiredFields({ email: data.email, password: data.password });
    this.validatorService.validateEmailFormat(data.email);
    this.validatorService.validatePassword(data.password);

    let user;
    if (role === UserRole.Patient) {
      user = await this.patientRepository.findByEmail(data.email);
      if (!user) throw new NotFoundError('Patient not found');
      if (user.isBlocked) throw new AuthenticationError('Account is blocked');
      if (!user.password) throw new AuthenticationError('Use OAuth or reset password');
      if (!user.isOtpVerified) throw new AuthenticationError('Email is not verified, please verify to continue');
    } else if (role === UserRole.Doctor) {
      user = await this.doctorRepository.findByEmail(data.email);
      if (!user) throw new NotFoundError('Doctor not found');
      if (user.isBlocked) throw new AuthenticationError('Account is blocked');
      if (!user.password) throw new AuthenticationError('Use OAuth or reset password');
    } else if (role === UserRole.Admin) {
      user = await this.adminRepository.findByEmail(data.email);
      if (!user) throw new NotFoundError('Admin not found');
      if (!user.password) throw new AuthenticationError('Reset password');
    } else {
      throw new AuthenticationError('Invalid role');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AuthenticationError('Invalid credentials');

    return user;
  }
}
