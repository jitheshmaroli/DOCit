import { OAuth2Client } from 'google-auth-library';
import { IAuthProvider } from '../../../core/interfaces/services/IAuthProvider';
import { IPatientRepository } from '../../../core/interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../core/interfaces/repositories/IDoctorRepository';
import { IValidatorService } from '../../../core/interfaces/services/IValidatorService';
import { UserRole } from '../../../types';
import { AuthenticationError, NotFoundError, ValidationError } from '../../../utils/errors';
import { env } from '../../../config/env';
import { AuthProviderData } from '../../../types/authTypes';
import { Patient } from '../../../core/entities/Patient';
import { Doctor } from '../../../core/entities/Doctor';

export class GoogleAuthProvider implements IAuthProvider {
  private client: OAuth2Client;

  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private validatorService: IValidatorService
  ) {
    this.client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URL);
  }

  private async verifyGoogleToken(token: string): Promise<{ googleId: string; email: string; name: string }> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new ValidationError('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        name: payload.name || '',
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Google token verification failed: ${(error as Error).message}`);
    }
  }

  async authenticate(role: UserRole, data: AuthProviderData): Promise<Patient | Doctor> {
    if (role === UserRole.Admin) throw new ValidationError('Google not supported for admin');

    if (!('token' in data)) throw new ValidationError('Token required');
    this.validatorService.validateRequiredFields({ token: data.token });

    const { googleId: id, email, name } = await this.verifyGoogleToken(data.token);
    this.validatorService.validateRequiredFields({ id, email, name });
    this.validatorService.validateEmailFormat(email);
    this.validatorService.validateName(name);

    const repo = role === UserRole.Patient ? this.patientRepository : this.doctorRepository;
    const otherRepo = role === UserRole.Patient ? this.doctorRepository : this.patientRepository;

    const otherUser = await otherRepo.findByEmail(email);
    if (otherUser) throw new ValidationError(`Email registered as ${role === UserRole.Patient ? 'doctor' : 'patient'}`);

    let user = (await repo.findByEmail(email)) || (await repo.findOne({ 'socialLogins.google': id }));

    if (!user) {
      const newUserData = {
        email,
        name,
        socialLogins: { google: id },
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (role === UserRole.Patient) {
        user = await repo.create({ ...newUserData, isSubscribed: false, isOtpVerified: true });
      } else {
        user = await repo.create({ ...newUserData, isVerified: false, allowFreeBooking: true, isOtpVerified: true });
      }
    } else if (!user.socialLogins?.google) {
      const updatedSocialLogins = { ...user.socialLogins, google: id };
      user = await repo.update(user._id!, { socialLogins: updatedSocialLogins, updatedAt: new Date() });
    }

    if (!user) throw new NotFoundError('User creation/update failed');
    if (user.isBlocked) throw new AuthenticationError('Account is blocked');

    return user;
  }
}
