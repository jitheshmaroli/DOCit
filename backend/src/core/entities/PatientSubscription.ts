export interface PatientSubscription {
  _id?: string;
  patientId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}
