// export interface User {
//   _id: string;
//   email: string;
//   name: string;
//   role: 'patient' | 'doctor' | 'admin';
//   phone?: string;
//   isVerified?: boolean;
//   isBlocked?: boolean;
//   isSubscribed?: boolean;
//   licenseNumber?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface Doctor {
  _id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  licenseNumber: string;
  isVerified: boolean;
  isBlocked: boolean;
  profilePicture?: string;
  availability?: string;
  speciality?: [];
  qualifications?: string[];
  age?: string;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

// export interface Patient {
//   _id: string;
//   email: string;
//   name: string;
//   phone: string;
//   isSubscribed: boolean;
//   isBlocked: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  otpSent: boolean;
  isAuthenticated: boolean;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  licenseNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: string;
}

export interface VerifyOtpPayload {
  email: string;
  role: string;
  otp?: string;
  password?: string;
  name?: string;
  phone?: string;
  licenseNumber?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

// export interface SubscriptionPlan {
//   _id: string;
//   doctorId?: string;
//   name?: string;
//   description: string;
//   price: number;
//   validityDays: number;
//   appointmentCount: number;
//   status: 'pending' | 'approved' | 'rejected';
//   doctorName?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface Subscription {
  _id: string;
  plan: SubscriptionPlan;
  daysUntilExpiration: number;
  isExpired: boolean;
  appointmentsLeft: number;
  status: 'active' | 'inactive';
  stripePaymentId?: string;
}

// export interface Appointment {
//   _id: string;
//   patientName: string;
//   doctorName?: string;
//   date: string;
//   startTime: string;
//   endTime: string;
//   isFreeBooking: boolean;
//   status: 'pending' | 'confirmed' | 'cancelled';
//   createdAt: string;
// }

export interface GetDoctorAvailabilityPayload {
  doctorId: string;
  startDate: Date;
  endDate?: Date;
}

export interface BookAppointmentPayload {
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isFreeBooking: boolean;
}

export interface AvailabilityPayload {
  startDate: Date;
  endDate?: Date;
}

export interface SetAvailabilityPayload {
  date: Date;
  timeSlots: { startTime: string; endTime: string }[];
}

export interface SubscriptionPlanPayload {
  name: string;
  description: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
}

export interface UpdateSubscriptionPlanPayload extends SubscriptionPlanPayload {
  id: string;
}

// export interface SubscriptionPlan {
//   _id: string;
//   name?: string;
//   description: string;
//   appointmentCost: number;
//   duration: number;
// }

// export interface Speciality {
//   _id: string;
//   name: string;
//   createdAt: string;
//   updatedAt: string;
// }

export interface TimeSlot {
  startTime: string;
  endTime: string;
  _id?: string;
  isBooked: boolean;
}

export interface SlotPickerProps {
  availableDates: string[];
  patientLoading: boolean;
  selectedDate: string;
  currentTimeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onDateChange: (date: string) => void;
  onSlotSelect: React.Dispatch<React.SetStateAction<TimeSlot | null>>;
}

//new

export interface User {
  _id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name?: string;
  phone?: string;
  isBlocked?: boolean;
}

// export interface Patient {
//   _id: string;
//   email: string;
//   name?: string;
//   role: 'patient';
//   isBlocked?: boolean;
//   subscriptionPlan?: string;
//   subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface Doctor {
//   _id: string;
//   email: string;
//   name?: string;
//   role: 'doctor';
//   isBlocked?: boolean;
//   isApproved?: boolean;
//   speciality?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface Doctor {
//   _id: string;
//   name: string;
//   email: string;
//   phone: string;
//   licenseNumber: string;
//   isVerified: boolean;
//   isBlocked: boolean;
//   profilePicture?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface SubscriptionPlan {
//   _id: string;
//   name: string;
//   description: string;
//   price: number;
//   duration: number;
//   features: string[];
//   isActive: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  doctorId: string;
  doctorName: string;
  price: number;
  validityDays: number;
  appointmentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// export interface Speciality {
//   _id: string;
//   name: string;
//   description?: string;
//   doctorId?: string;
//   doctorName?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface Speciality {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// export interface Appointment {
//   _id: string;
//   patientId: string;
//   patientName?: string;
//   doctorId: string;
//   doctorName?: string;
//   date: string;
//   startTime: string;
//   endTime: string;
//   status: 'pending' | 'confirmed' | 'cancelled';
//   createdAt?: string;
//   updatedAt?: string;
// }

export interface Patient {
  _id: string;
  email: string;
  name: string;
  phone: string;
  isSubscribed: boolean;
  isBlocked: boolean;
  address?: string;
  age?: string;
  gender?: string;
  pincode?: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patientId: Patient;
  patientName: string;
  doctorId: { _id: string; name: string };
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  speciality?: string;
  isBlocked?: boolean;
  isVerified?: boolean;
  isSubscribed?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isSubscribed?: boolean;
  dateFrom?: string;
  isVerified?: boolean;
  dateTo?: string;
  status?: string;
  specialty?: string;
}

export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PLAN_APPROVED = 'plan_approved',
  PLAN_REJECTED = 'plan_rejected',
  PLAN_SUBSCRIBED = 'plan_subscribed',
  DOCTOR_VERIFIED = 'doctor_verified',
}

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}
