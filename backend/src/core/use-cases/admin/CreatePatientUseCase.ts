import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { ValidationError } from '../../../utils/errors';
import bcrypt from 'bcryptjs';

export class CreatePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(patient: Partial<Patient>): Promise<Patient> {
    if (!patient.email || !patient.password) {
      throw new ValidationError('Email and password are required');
    }

    const hashedPassword = await bcrypt.hash(patient.password, 10);

    const newPatient: Patient = {
      email: patient.email,
      password: hashedPassword,
      name: patient.name,
      phone: patient.phone,
      age: patient.age,
      isBlocked: false,
    };
    return this.patientRepository.create(newPatient);
  }
}
