import { IDoctorRepository } from '../../../interfaces/repositories/IDoctorRepository';
import { verifyGoogleToken } from '../../../../utils/googleAuth';
import { NotFoundError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';

export class GoogleSignInDoctorUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private tokenService: ITokenService
  ) {}

  async execute(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { googleId, email, name } = await verifyGoogleToken(token);

    let doctor = await this.doctorRepository.findByEmail(email);
    if (!doctor) {
      doctor = await this.doctorRepository.create({
        email,
        googleId,
        name,
        isVerified: false,
        isBlocked: false,
        speciality: '',
        experience: 0,
        allowFreeBooking: true,
      });
    } else if (!doctor.googleId) {
      doctor = await this.doctorRepository.update(doctor._id!, { googleId });
    }

    if (!doctor)
      throw new NotFoundError(
        'Unexpected error: Doctor is null after creation/update'
      );

    const accessToken = this.tokenService.generateAccessToken(
      doctor._id!,
      'doctor'
    );
    const refreshToken = this.tokenService.generateRefreshToken(
      doctor._id!,
      'doctor'
    );
    await this.doctorRepository.update(doctor._id!, { refreshToken });

    return { accessToken, refreshToken };
  }
}
