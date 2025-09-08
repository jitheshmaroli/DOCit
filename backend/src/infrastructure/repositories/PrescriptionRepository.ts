import mongoose from 'mongoose';
import { Prescription } from '../../core/entities/Prescription';
import { PrescriptionModel } from '../database/models/PrescriptionModel';
import { BaseRepository } from './BaseRepository';
import { IPrescriptionRepository } from '../../core/interfaces/repositories/IPrescriptionRepository';

export class PrescriptionRepository extends BaseRepository<Prescription> implements IPrescriptionRepository {
  constructor() {
    super(PrescriptionModel);
  }

  async createPrescription(
    appointmentId: string,
    patientId: string,
    doctorId: string,
    prescriptionData: Omit<
      Prescription,
      '_id' | 'appointmentId' | 'patientId' | 'doctorId' | 'createdAt' | 'updatedAt' | 'pdfUrl'
    >
  ): Promise<Prescription> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error('Invalid appointment ID');
    }
    const { medications, notes } = prescriptionData;
    const newPrescription = new PrescriptionModel({
      appointmentId,
      patientId,
      doctorId,
      medications,
      notes,
    });
    const savedPrescription = await newPrescription.save();
    return savedPrescription.toObject() as Prescription;
  }
}
