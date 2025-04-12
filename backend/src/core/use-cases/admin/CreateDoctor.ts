import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { ValidationError } from '../../../utils/errors';

export class CreateDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctor: Partial<Doctor>): Promise<Doctor> {
    if (!doctor.email || !doctor.password || !doctor.licenseNumber) {
      throw new ValidationError(
        'Email, password, and license number are required'
      );
    }
    const newDoctor: Doctor = {
      email: doctor.email,
      password: doctor.password,
      name: doctor.name,
      phone: doctor.phone,
      licenseNumber: doctor.licenseNumber,
      isVerified: false,
      isBlocked: false,
    };
    return this.doctorRepository.create(newDoctor);
  }
}
