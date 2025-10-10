export interface Speciality {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Experience {
  hospitalName: string;
  department: string;
  years: string;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  qualifications: string;
  location: string;
  speciality: string;
  gender: string;
  allowFreeBooking: boolean;
  experiences: Experience[];
  licenseProof?: string;
}