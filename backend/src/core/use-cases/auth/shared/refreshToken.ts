import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';
import { AuthenticationError, ForbiddenError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';

export class RefreshTokenUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository,
    private tokenService: ITokenService
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    let decoded;
    try {
      decoded = this.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const { userId, role } = decoded;

    let user;
    if (role === 'patient') {
      user = await this.patientRepository.findById(userId);
    } else if (role === 'doctor') {
      user = await this.doctorRepository.findById(userId);
    } else if (role === 'admin') {
      user = await this.adminRepository.findById(userId);
    } else {
      throw new ForbiddenError('Invalid role in refresh token');
    }

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const newAccessToken = this.tokenService.generateAccessToken(userId, role);
    const newRefreshToken = this.tokenService.generateRefreshToken(userId, role);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
