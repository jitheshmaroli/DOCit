import { Patient } from '../../entities/Patient';
import { IPatientRepository } from '../../interfaces/repositories/IPatientRepository';
import { ForbiddenError, NotFoundError } from '../../../utils/errors';
import { IImageUploadService } from '../../interfaces/services/IImageUploadService';

export class UpdatePatientProfileUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private imageUploadService: IImageUploadService
  ) {}

  async execute(
    patientId: string,
    requesterId: string,
    updates: Partial<Patient>,
    file?: Express.Multer.File
  ): Promise<Patient | null> {
    if (patientId !== requesterId) {
      throw new ForbiddenError('You can only update your own profile');
    }
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    if (file) {
      // Upload new image to Cloudinary
      const { url, publicId } = await this.imageUploadService.uploadImage(file, 'patient-profiles');
      updates.profilePicture = url;
      updates.profilePicturePublicId = publicId;

      // Delete old image if it exists
      if (patient.profilePicturePublicId) {
        await this.imageUploadService.deleteImage(patient.profilePicturePublicId);
      }
    }

    return this.patientRepository.update(patientId, updates);
  }
}
