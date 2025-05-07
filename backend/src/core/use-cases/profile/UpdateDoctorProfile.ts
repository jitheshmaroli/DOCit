import { NotFoundError } from '../../../utils/errors';
import { Doctor } from '../../entities/Doctor';
import { IDoctorRepository } from '../../interfaces/repositories/IDoctorRepository';
import { IImageUploadService } from '../../interfaces/services/IImageUploadService';

export class UpdateDoctorProfileUseCase {
  constructor(
    private doctorRepository: IDoctorRepository,
    private imageUploadService: IImageUploadService
  ) {}

  async execute(
    doctorId: string,
    updates: Partial<Doctor>,
    file?: Express.Multer.File
  ): Promise<Doctor | null> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor not found');

    if (file) {
      const { url, publicId } = await this.imageUploadService.uploadImage(
        file,
        'doctor-profiles'
      );
      updates.profilePicture = url;
      updates.profilePicturePublicId = publicId;

      if (doctor.profilePicturePublicId) {
        await this.imageUploadService.deleteImage(
          doctor.profilePicturePublicId
        );
      }
    }

    return this.doctorRepository.update(doctorId, updates);
  }
}
