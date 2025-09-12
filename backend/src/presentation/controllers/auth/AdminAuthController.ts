import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { IDoctorUseCase } from '../../../core/interfaces/use-cases/IDoctorUseCase';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';
import { QueryParams } from '../../../types/authTypes';

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
      const loginData = {
        email: req.body.email,
        password: req.body.password,
      };
      if (!loginData.email || !loginData.password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.loginAdmin(loginData);
      setTokensInCookies(res, accessToken, refreshToken);
      const responseData = { accessToken, refreshToken, message: ResponseMessages.LOGGED_IN };
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data, totalItems } = await this._patientUseCase.listPatients(params);
      res.status(HttpStatusCode.OK).json({ data, totalItems });
    } catch (error) {
      next(error);
    }
  }

  async listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = req.query as QueryParams;
      const { data, totalItems } = await this._doctorUseCase.listDoctors(params);
      res.status(HttpStatusCode.OK).json({ data, totalItems });
    } catch (error) {
      next(error);
    }
  }

  async verifyDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const responseData = await this._doctorUseCase.verifyDoctor(doctorId);
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorData = {
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
      const responseDTO = await this._doctorUseCase.createDoctor(doctorData);
      res.status(HttpStatusCode.CREATED).json(responseDTO);
    } catch (error) {
      next(error);
    }
  }

  async updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.id;
      const updates = req.body;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const responseData = await this._doctorUseCase.updateDoctor(doctorId, updates);
      res.status(HttpStatusCode.OK).json(responseData);
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
      const responseData = await this._doctorUseCase.blockDoctor(doctorId, isBlocked);
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientData = {
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
      const responseData = await this._patientUseCase.createPatient(patientData);
      res.status(HttpStatusCode.CREATED).json(responseData);
    } catch (error) {
      next(error);
    }
  }

  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      const updates = req.body;
      if (!patientId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const responseData = await this._patientUseCase.updatePatient(patientId, updates);
      if (!responseData) throw new NotFoundError(ResponseMessages.PATIENT_NOT_FOUND);
      res.status(HttpStatusCode.OK).json(responseData);
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
      const responseData = await this._patientUseCase.blockPatient(patientId, isBlocked);
      if (!responseData) throw new NotFoundError(ResponseMessages.PATIENT_NOT_FOUND);
      res.status(HttpStatusCode.OK).json(responseData);
    } catch (error) {
      next(error);
    }
  }
}
