import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { verifyGoogleToken } from '../../../../utils/googleAuth';
import { NotFoundError } from '../../../../utils/errors';
import { ITokenService } from '../../../interfaces/services/ITokenService';

export class GoogleSignInPatientUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private tokenService: ITokenService
  ) {}

  async execute(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { googleId, email, name } = await verifyGoogleToken(token);

    let patient = await this.patientRepository.findByEmail(email);
    if (!patient) {
      patient = await this.patientRepository.create({
        email,
        googleId,
        name,
        isSubscribed: false,
        isBlocked: false,
      });
    } else if (!patient.googleId) {
      patient = await this.patientRepository.update(patient._id!, { googleId });
    }

    if (!patient) throw new NotFoundError('Unexpected error: Patient is null after creation/update');

    const accessToken = this.tokenService.generateAccessToken(patient._id!, 'patient');
    const refreshToken = this.tokenService.generateRefreshToken(patient._id!, 'patient');
    await this.patientRepository.update(patient._id!, { refreshToken });

    return { accessToken, refreshToken };
  }
}
