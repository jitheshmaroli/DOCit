import { Doctor } from '../../entities/Doctor';
import { Patient } from '../../entities/Patient';

export interface IProfileUseCase {
  viewDoctorProfile(doctorId: string): Promise<Doctor>;
  updateDoctorProfile(
    doctorId: string,
    updates: Partial<Doctor>,
    profilePictureFile?: Express.Multer.File,
    licenseProofFile?: Express.Multer.File
  ): Promise<Doctor | null>;
  viewPatientProfile(patientId: string): Promise<Patient>;
  updatePatientProfile(
    patientId: string,
    updates: Partial<Patient>,
    file?: Express.Multer.File
  ): Promise<Patient | null>;
}
