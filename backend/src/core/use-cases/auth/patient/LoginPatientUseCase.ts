import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import bcrypt from 'bcryptjs';
import { AuthenticationError, NotFoundError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';

export class LoginPatientUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private tokenService: ITokenService
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const patient = await this.patientRepository.findByEmail(email);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    if (!patient.password) {
      throw new AuthenticationError(
        'This account was created with Google. Please use Google Sign-In or add a password.'
      );
    }
    const isPasswordValid = await bcrypt.compare(password, patient.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(
      patient._id!,
      'patient'
    );
    const refreshToken = this.tokenService.generateRefreshToken(
      patient._id!,
      'patient'
    );
    await this.patientRepository.update(patient._id!, { refreshToken });

    return { accessToken, refreshToken };
  }
}
