export interface SubscriptionPlan {
  _id?: string;
  doctorId?: string;
  name: string;
  description: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
