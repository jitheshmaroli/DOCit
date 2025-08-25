import { DoctorDTO } from '../../../application/dtos/DoctorDTOs';
import { PatientDTO } from '../../../application/dtos/PatientDTOs';

export interface IProfileUseCase {
  viewDoctorProfile(doctorId: string): Promise<DoctorDTO>;
  updateDoctorProfile(
    doctorId: string,
    updates: Partial<DoctorDTO>,
    profilePictureFile?: Express.Multer.File,
    licenseProofFile?: Express.Multer.File
  ): Promise<DoctorDTO | null>;
  viewPatientProfile(patientId: string): Promise<PatientDTO>;
  updatePatientProfile(
    patientId: string,
    updates: Partial<PatientDTO>,
    file?: Express.Multer.File
  ): Promise<PatientDTO | null>;
}
