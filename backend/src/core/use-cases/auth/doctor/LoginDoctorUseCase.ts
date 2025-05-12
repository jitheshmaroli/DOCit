import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import bcrypt from 'bcryptjs';
import { AuthenticationError, NotFoundError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';

export class LoginDoctorUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private tokenService: ITokenService
  ) {}

  async execute(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const doctor = await this.doctorRepository.findByEmail(email);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    if (!doctor.password) {
      throw new AuthenticationError(
        'This account was created with Google. Please use Google Sign-In or add a password.'
      );
    }
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(doctor._id!, 'doctor');
    const refreshToken = this.tokenService.generateRefreshToken(doctor._id!, 'doctor');
    await this.doctorRepository.update(doctor._id!, { refreshToken });

    return { accessToken, refreshToken };
  }
}
