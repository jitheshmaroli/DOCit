import { IAdminRepository } from '../../../interfaces/repositories/IAdminRepository';
import bcrypt from 'bcryptjs';
import { AuthenticationError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';

export class LoginAdminUseCase {
  constructor(
    private adminRepository: IAdminRepository,
    private tokenService: ITokenService
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin || !(await bcrypt.compare(password, admin.password!))) {
      throw new AuthenticationError('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken(
      admin._id!,
      'admin'
    );
    const refreshToken = this.tokenService.generateRefreshToken(
      admin._id!,
      'admin'
    );
    await this.adminRepository.update(admin._id!, { refreshToken });

    return { accessToken, refreshToken };
  }
}
