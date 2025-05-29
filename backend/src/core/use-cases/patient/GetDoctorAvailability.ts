import { Availability } from '../../entities/Availability';
import { IAvailabilityRepository } from '../../interfaces/repositories/IAvailabilityRepository';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { NotFoundError } from '../../../utils/errors';
import logger from '../../../utils/logger';

export class GetDoctorAvailabilityUseCase {
  constructor(
    private availabilityRepository: IAvailabilityRepository,
    private doctorRepository: IDoctorRepository
  ) {}

  async execute(
    doctorId: string,
    startDate: Date,
    endDate: Date,
    filterBooked: boolean = false
  ): Promise<Availability[]> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (filterBooked) {
      logger.debug('fileterd book');
      return this.availabilityRepository.findByDoctorAndDateRangeWithUnbookedSlots(doctorId, startDate, endDate);
    }
    return this.availabilityRepository.findByDoctorAndDateRange(doctorId, startDate, endDate);
  }
}
