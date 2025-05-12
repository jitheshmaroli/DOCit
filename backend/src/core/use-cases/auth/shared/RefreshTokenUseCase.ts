import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';
import { AuthenticationError, ForbiddenError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';
import { UserRole } from '../../../../types';

export class RefreshTokenUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private doctorRepository: IDoctorRepository,
    private adminRepository: IAdminRepository,
    private tokenService: ITokenService
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded;
    try {
      decoded = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const { userId, role } = decoded;
    const userRole = role as UserRole;

    if (!Object.values(UserRole).includes(userRole)) {
      throw new ForbiddenError('Invalid role in refresh token');
    }

    let user;
    if (userRole === UserRole.Patient) {
      user = await this.patientRepository.findById(userId);
    } else if (userRole === UserRole.Doctor) {
      user = await this.doctorRepository.findById(userId);
    } else if (userRole === UserRole.Admin) {
      user = await this.adminRepository.findById(userId);
    }

    if (!user || user.refreshToken !== refreshToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const newAccessToken = this.tokenService.generateAccessToken(userId, userRole);
    const newRefreshToken = this.tokenService.generateRefreshToken(userId, userRole);

    if (userRole === UserRole.Patient) {
      await this.patientRepository.update(userId, {
        refreshToken: newRefreshToken,
      });
    } else if (userRole === UserRole.Doctor) {
      await this.doctorRepository.update(userId, {
        refreshToken: newRefreshToken,
      });
    } else if (userRole === UserRole.Admin) {
      await this.adminRepository.update(userId, {
        refreshToken: newRefreshToken,
      });
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
