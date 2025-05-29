import { NotFoundError } from '../../../utils/errors';
import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { ISpecialityRepository } from '../../interfaces/repositories/ISpecialityRepository';

export class ViewDoctorProfileUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private specialityRepository: ISpecialityRepository
  ) {}

  async execute(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');
    if (doctor.speciality) {
      const speciality = await this.specialityRepository.findById(doctor.speciality[0]);
      doctor.speciality = speciality?.name;
    }
    return doctor;
  }
}
