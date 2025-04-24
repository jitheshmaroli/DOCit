export interface SubscriptionPlan {
  _id?: string;
  doctorId: string;
  name: string;
  description: string;
  appointmentCost: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
