export interface SubscriptionPlan {
  _id?: string;
  doctorId: string;
  name: string;
  description: string;
  appointmentCost: number; 
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}
