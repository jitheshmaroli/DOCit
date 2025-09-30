export interface AppointmentPatient {
  _id: string;
  name?: string;
  profilePicture?: string;
}

export interface AppointmentDoctor {
  _id: string;
  name: string;
  profilePicture?: string;
  speciality?: string[];
  qualifications?: string[];
  age?: number;
  gender?: string;
}

export interface Prescription {
  _id?: string;
  appointmentId?: string;
  patientId?: string | { _id: string; name: string };
  doctorId?: string | { _id: string; name: string };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    _id?: string;
  }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  pdfUrl?: string;
}

export interface Appointment {
  _id: string;
  patientId: AppointmentPatient;
  doctorId: AppointmentDoctor;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled';
  isFreeBooking?: boolean;
  bookingTime?: string;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
  prescriptionId?: Prescription;
  prescription?: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    notes?: string;
    pdfUrl?: string;
  };
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface FormErrors {
  medications: Array<{ [key in keyof Medication]?: string }>;
  notes?: string;
}

export interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}
