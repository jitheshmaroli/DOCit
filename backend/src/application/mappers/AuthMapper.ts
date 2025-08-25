import { Doctor } from '../../core/entities/Doctor';
import { Patient } from '../../core/entities/Patient';
import { UserRole } from '../../types';
import { SignupRequestDTO, VerifySignupOTPResponseDTO } from '../dtos/AuthDtos';

export class AuthMapper {
  static mapDoctorToEntity(dto: SignupRequestDTO): Doctor {
    return {
      email: dto.email,
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
      licenseNumber: dto.licenseNumber,
      isVerified: false,
      isOtpVerified: false,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static mapPatientToEntity(dto: SignupRequestDTO): Patient {
    return {
      email: dto.email,
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
      isSubscribed: false,
      isBlocked: false,
      isOtpVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static mapEntityToVerifySignupResponseDTO(
    entity: Doctor | Patient,
    role: UserRole.Patient | UserRole.Doctor,
    accessToken: string,
    refreshToken: string
  ): VerifySignupOTPResponseDTO {
    return {
      message: 'OTP verified successfully',
      user: {
        _id: entity._id!,
        email: entity.email,
        name: entity.name!,
        role,
      },
      accessToken,
      refreshToken,
    };
  }
}
