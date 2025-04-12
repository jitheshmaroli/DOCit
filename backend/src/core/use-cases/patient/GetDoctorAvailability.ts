import { Availability } from '../../entities/Availability';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';

export class GetDoctorAvailabilityUseCase {
  constructor(private availabilityRepository: IAvailabilityRepository) {}

  async execute(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Availability[]> {
    return this.availabilityRepository.findByDoctorAndDateRange(
      doctorId,
      startDate,
      endDate
    );
  }
}
