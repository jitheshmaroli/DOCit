import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { ValidationError } from '../../../utils/errors';
import bcrypt from 'bcryptjs';

export class CreateDoctorUseCase {
  constructor(private doctorRepository: IDoctorRepository) {}

  async execute(doctor: Partial<Doctor>): Promise<Doctor> {
    if (!doctor.email || !doctor.password || !doctor.licenseNumber) {
      throw new ValidationError('Email, password, and license number are required');
    }

    const hashedPassword = await bcrypt.hash(doctor.password, 10);

    const newDoctor: Doctor = {
      email: doctor.email,
      name: doctor.name,
      password: hashedPassword,
      phone: doctor.phone,
      licenseNumber: doctor.licenseNumber,
      speciality: doctor.speciality,
      experience: doctor.experience || 0,
      allowFreeBooking: doctor.allowFreeBooking ?? true,
      isVerified: false,
      isBlocked: false,
    };

    return this.doctorRepository.create(newDoctor);
  }
}
