import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { IDoctorUseCase } from '../../../core/interfaces/use-cases/IDoctorUseCase';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';
import { LoginRequestDTO, LoginResponseDTO } from '../../../core/interfaces/AuthDtos';
import { QueryParams } from '../../../types/authTypes';
import { PaginatedPatientResponseDTO, PatientDTO } from '../../../core/interfaces/PatientDTOs';
import { DoctorDTO, PaginatedDoctorResponseDTO } from '../../../core/interfaces/DoctorDTOs';

export class AdminAuthController {
  private _authenticationUseCase: IAuthenticationUseCase;
  private _doctorUseCase: IDoctorUseCase;
  private _patientUseCase: IPatientUseCase;

  constructor(container: Container) {
    this._authenticationUseCase = container.get<IAuthenticationUseCase>('IAuthenticationUseCase');
    this._doctorUseCase = container.get<IDoctorUseCase>('IDoctorUseCase');
    this._patientUseCase = container.get<IPatientUseCase>('IPatientUseCase');
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginDTO: LoginRequestDTO = {
        email: req.body.email,
        password: req.body.password,
      };
      if (!loginDTO.email || !loginDTO.password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.loginAdmin(
        loginDTO.email,
        loginDTO.password
      );
      setTokensInCookies(res, accessToken, refreshToken);
      const responseDTO: LoginResponseDTO = { accessToken, refreshToken, message: ResponseMessages.LOGGED_IN };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: patients, totalItems } = await this._patientUseCase.listPatients(params);
      const { page = 1, limit = 10 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      const responseDTO: PaginatedPatientResponseDTO = {
        data: patients.map((patient) => ({
          _id: patient._id,
          email: patient.email,
          name: patient.name,
          phone: patient.phone,
          age: patient.age,
          isSubscribed: patient.isSubscribed,
          isBlocked: patient.isBlocked,
          address: patient.address,
          pincode: patient.pincode,
          profilePicture: patient.profilePicture,
          profilePicturePublicId: patient.profilePicturePublicId,
          gender: patient.gender,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
        })),
        totalPages,
        currentPage: page,
        totalItems,
      };

      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data: doctors, totalItems } = await this._doctorUseCase.listDoctors(params);
      const { page = 1, limit = 5 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      const responseDTO: PaginatedDoctorResponseDTO = {
        data: doctors.map((doctor) => ({
          _id: doctor._id,
          email: doctor.email,
          name: doctor.name,
          phone: doctor.phone,
          qualifications: doctor.qualifications,
          licenseNumber: doctor.licenseNumber,
          location: doctor.location,
          speciality: doctor.speciality,
          totalExperience: doctor.totalExperience,
          experiences: doctor.experiences,
          allowFreeBooking: doctor.allowFreeBooking,
          gender: doctor.gender,
          isVerified: doctor.isVerified,
          isBlocked: doctor.isBlocked,
          profilePicture: doctor.profilePicture,
          profilePicturePublicId: doctor.profilePicturePublicId,
          licenseProof: doctor.licenseProof,
          licenseProofPublicId: doctor.licenseProofPublicId,
          averageRating: doctor.averageRating,
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt,
        })),
        totalPages,
        currentPage: page,
        totalItems,
      };

      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async verifyDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const doctor = await this._doctorUseCase.verifyDoctor(doctorId);
      const responseDTO: DoctorDTO = {
        _id: doctor._id,
        email: doctor.email,
        name: doctor.name,
        phone: doctor.phone,
        qualifications: doctor.qualifications,
        licenseNumber: doctor.licenseNumber,
        location: doctor.location,
        speciality: doctor.speciality,
        totalExperience: doctor.totalExperience,
        experiences: doctor.experiences,
        allowFreeBooking: doctor.allowFreeBooking,
        gender: doctor.gender,
        isVerified: doctor.isVerified,
        isBlocked: doctor.isBlocked,
        profilePicture: doctor.profilePicture,
        profilePicturePublicId: doctor.profilePicturePublicId,
        licenseProof: doctor.licenseProof,
        licenseProofPublicId: doctor.licenseProofPublicId,
        averageRating: doctor.averageRating,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorDTO: DoctorDTO = {
        email: req.body.email,
        name: req.body.name,
        phone: req.body.phone,
        qualifications: req.body.qualifications,
        licenseNumber: req.body.licenseNumber,
        location: req.body.location,
        speciality: req.body.speciality,
        experiences: req.body.experiences,
        allowFreeBooking: req.body.allowFreeBooking,
        gender: req.body.gender,
        isVerified: req.body.isVerified,
        isBlocked: req.body.isBlocked,
        profilePicture: req.body.profilePicture,
        profilePicturePublicId: req.body.profilePicturePublicId,
        licenseProof: req.body.licenseProof,
        licenseProofPublicId: req.body.licenseProofPublicId,
      };
      const newDoctor = await this._doctorUseCase.createDoctor(doctorDTO);
      const responseDTO: DoctorDTO = {
        _id: newDoctor._id,
        email: newDoctor.email,
        name: newDoctor.name,
        phone: newDoctor.phone,
        qualifications: newDoctor.qualifications,
        licenseNumber: newDoctor.licenseNumber,
        location: newDoctor.location,
        speciality: newDoctor.speciality,
        totalExperience: newDoctor.totalExperience,
        experiences: newDoctor.experiences,
        allowFreeBooking: newDoctor.allowFreeBooking,
        gender: newDoctor.gender,
        isVerified: newDoctor.isVerified,
        isBlocked: newDoctor.isBlocked,
        profilePicture: newDoctor.profilePicture,
        profilePicturePublicId: newDoctor.profilePicturePublicId,
        licenseProof: newDoctor.licenseProof,
        licenseProofPublicId: newDoctor.licenseProofPublicId,
        averageRating: newDoctor.averageRating,
        createdAt: newDoctor.createdAt,
        updatedAt: newDoctor.updatedAt,
      };
      res.status(HttpStatusCode.CREATED).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.id;
      const updates: Partial<DoctorDTO> = req.body;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const doctor = await this._doctorUseCase.updateDoctor(doctorId, updates);
      const responseDTO: DoctorDTO = {
        _id: doctor._id,
        email: doctor.email,
        name: doctor.name,
        phone: doctor.phone,
        qualifications: doctor.qualifications,
        licenseNumber: doctor.licenseNumber,
        location: doctor.location,
        speciality: doctor.speciality,
        totalExperience: doctor.totalExperience,
        experiences: doctor.experiences,
        allowFreeBooking: doctor.allowFreeBooking,
        gender: doctor.gender,
        isVerified: doctor.isVerified,
        isBlocked: doctor.isBlocked,
        profilePicture: doctor.profilePicture,
        profilePicturePublicId: doctor.profilePicturePublicId,
        licenseProof: doctor.licenseProof,
        licenseProofPublicId: doctor.licenseProofPublicId,
        averageRating: doctor.averageRating,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async deleteDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.id;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this._doctorUseCase.deleteDoctor(doctorId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async blockDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.id;
      const { isBlocked } = req.body;
      if (!doctorId || typeof isBlocked !== 'boolean') throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const doctor = await this._doctorUseCase.blockDoctor(doctorId, isBlocked);
      const responseDTO: DoctorDTO = {
        _id: doctor._id,
        email: doctor.email,
        name: doctor.name,
        phone: doctor.phone,
        qualifications: doctor.qualifications,
        licenseNumber: doctor.licenseNumber,
        location: doctor.location,
        speciality: doctor.speciality,
        totalExperience: doctor.totalExperience,
        experiences: doctor.experiences,
        allowFreeBooking: doctor.allowFreeBooking,
        gender: doctor.gender,
        isVerified: doctor.isVerified,
        isBlocked: doctor.isBlocked,
        profilePicture: doctor.profilePicture,
        profilePicturePublicId: doctor.profilePicturePublicId,
        licenseProof: doctor.licenseProof,
        licenseProofPublicId: doctor.licenseProofPublicId,
        averageRating: doctor.averageRating,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientDTO: PatientDTO = {
        email: req.body.email,
        name: req.body.name,
        phone: req.body.phone,
        age: req.body.age,
        isSubscribed: req.body.isSubscribed,
        isBlocked: req.body.isBlocked,
        address: req.body.address,
        pincode: req.body.pincode,
        profilePicture: req.body.profilePicture,
        profilePicturePublicId: req.body.profilePicturePublicId,
        gender: req.body.gender,
      };
      const newPatient = await this._patientUseCase.createPatient(patientDTO);
      const responseDTO: PatientDTO = {
        _id: newPatient._id,
        email: newPatient.email,
        name: newPatient.name,
        phone: newPatient.phone,
        age: newPatient.age,
        isSubscribed: newPatient.isSubscribed,
        isBlocked: newPatient.isBlocked,
        address: newPatient.address,
        pincode: newPatient.pincode,
        profilePicture: newPatient.profilePicture,
        profilePicturePublicId: newPatient.profilePicturePublicId,
        gender: newPatient.gender,
        createdAt: newPatient.createdAt,
        updatedAt: newPatient.updatedAt,
      };
      res.status(HttpStatusCode.CREATED).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      const updates: Partial<PatientDTO> = req.body;

      if (!patientId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const patient = await this._patientUseCase.updatePatient(patientId, updates);
      if (!patient) throw new NotFoundError(ResponseMessages.PATIENT_NOT_FOUND);

      const responseDTO: PatientDTO = {
        _id: patient._id,
        email: patient.email,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        isSubscribed: patient.isSubscribed,
        isBlocked: patient.isBlocked,
        address: patient.address,
        pincode: patient.pincode,
        profilePicture: patient.profilePicture,
        profilePicturePublicId: patient.profilePicturePublicId,
        gender: patient.gender,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      if (!patientId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      await this._patientUseCase.deletePatient(patientId);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async blockPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      const { isBlocked } = req.body;
      if (!patientId || typeof isBlocked !== 'boolean') throw new ValidationError(ResponseMessages.BAD_REQUEST);

      const patient = await this._patientUseCase.blockPatient(patientId, isBlocked);
      if (!patient) throw new NotFoundError(ResponseMessages.PATIENT_NOT_FOUND);

      const responseDTO: PatientDTO = {
        _id: patient._id,
        email: patient.email,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        isSubscribed: patient.isSubscribed,
        isBlocked: patient.isBlocked,
        address: patient.address,
        pincode: patient.pincode,
        profilePicture: patient.profilePicture,
        profilePicturePublicId: patient.profilePicturePublicId,
        gender: patient.gender,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      };
      res.status(HttpStatusCode.OK).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }
}
