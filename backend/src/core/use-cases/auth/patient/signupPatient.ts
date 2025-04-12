import { ConflictError, ValidationError } from '../../../../utils/errors';
import { Patient } from '../../../entities/Patient';
import { IPatientRepository } from '../../../interfaces/repositories/IPatientRepository';
import { IOTPService } from '../../../interfaces/services/IOTPService';

export class SignupPatientUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private otpService: IOTPService
  ) {}

  async execute(patient: Patient): Promise<Patient> {
    if (!patient.email || !patient.phone) {
      throw new ValidationError(
        'Email and phone are required for patient signup'
      );
    }
    const existingPatient = await this.patientRepository.findByEmail(
      patient.email
    );
    if (existingPatient) {
      if (existingPatient.googleId) {
        await this.otpService.sendOTP(patient.email);
        return existingPatient;
      }
      throw new ConflictError('Email already registered');
    }

    await this.otpService.deleteOTP(patient.email);
    await this.otpService.sendOTP(patient.email);
    return patient;
  }
}
