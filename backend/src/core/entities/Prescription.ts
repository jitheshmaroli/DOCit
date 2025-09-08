export interface Prescription {
  _id?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
  pdfUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
