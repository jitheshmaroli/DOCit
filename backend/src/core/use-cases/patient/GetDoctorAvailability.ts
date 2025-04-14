import { Availability } from '../../entities/Availability';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';

export class GetDoctorAvailabilityUseCase {
  constructor(
    private availabilityRepository: IAvailabilityRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    return this.availabilityRepository.findByDoctorAndDateRange(
      doctorId,
      startDate,
      endDate
    );
  }
}
