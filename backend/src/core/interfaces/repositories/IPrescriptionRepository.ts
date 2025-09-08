import { Prescription } from '../../entities/Prescription';
import { IBaseRepository } from './IBaseRepository';

export interface IPrescriptionRepository extends IBaseRepository<Prescription> {
  createPrescription(
    appointmentId: string,
    patientId: string,
    doctorId: string,
    prescriptionData: Omit<
      Prescription,
      '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt' | 'pdfUrl'
    >
  ): Promise<Prescription>;
}
