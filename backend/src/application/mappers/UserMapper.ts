import { Admin } from '../../core/entities/Admin';
import { Doctor } from '../../core/entities/Doctor';
import { Patient } from '../../core/entities/Patient';
import { UserRole } from '../../types';
import { GetUserResponseDTO } from '../dtos/UserDTOs';
import { PatientSubscriptionMapper } from './PatientSubscriptionMapper';

export class UserMapper {
  static toGetUserResponseDTO(entity: Admin | Doctor | Patient, role: UserRole): GetUserResponseDTO {
    const baseDTO = {
      _id: entity._id?.toString() ?? '',
      email: entity.email,
      name: entity.name,
      role,
      phone: entity.phone,
      isBlocked: entity.isBlocked,
      lastSeen: entity.lastSeen?.toISOString(),
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };

    if (role === UserRole.Patient) {
      const patient = entity as Patient;
      return {
        ...baseDTO,
        age: patient.age,
        isSubscribed: patient.isSubscribed,
        address: patient.address,
        pincode: patient.pincode,
        profilePicture: patient.profilePicture,
        profilePicturePublicId: patient.profilePicturePublicId,
        gender: patient.gender,
        subscribedPlans: patient.subscribedPlans?.map(PatientSubscriptionMapper.toDTO),
      };
    }

    if (role === UserRole.Doctor) {
      const doctor = entity as Doctor;
      return {
        ...baseDTO,
        qualifications: doctor.qualifications,
        licenseNumber: doctor.licenseNumber,
        location: doctor.location,
        speciality: doctor.speciality,
        totalExperience: doctor.totalExperience,
        experiences: doctor.experiences,
        allowFreeBooking: doctor.allowFreeBooking,
        gender: doctor.gender,
        isVerified: doctor.isVerified,
        profilePicture: doctor.profilePicture,
        profilePicturePublicId: doctor.profilePicturePublicId,
        licenseProof: doctor.licenseProof,
        licenseProofPublicId: doctor.licenseProofPublicId,
        averageRating: doctor.averageRating,
      };
    }

    return baseDTO;
  }
}
