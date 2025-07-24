import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { IDoctorUseCase } from '../../../core/interfaces/use-cases/IDoctorUseCase';
import { IPatientUseCase } from '../../../core/interfaces/use-cases/IPatientUseCase';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { PaginatedResponse, QueryParams } from '../../../types/authTypes';
import { Patient } from '../../../core/entities/Patient';
import { Doctor } from '../../../core/entities/Doctor';
import { HttpStatusCode } from '../../../core/constants/HttpStatusCode';
import { ResponseMessages } from '../../../core/constants/ResponseMessages';
import { IAuthenticationUseCase } from '../../../core/interfaces/use-cases/IAuthenticationUseCase';

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
      const { email, password } = req.body;
      if (!email || !password) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const { accessToken, refreshToken } = await this._authenticationUseCase.loginAdmin(email, password);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(HttpStatusCode.OK).json({ message: ResponseMessages.LOGGED_IN });
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

      res.status(HttpStatusCode.OK).json({
        data: patients,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<Patient>);
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

      res.status(HttpStatusCode.OK).json({
        data: doctors,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<Doctor>);
    } catch (error) {
      next(error);
    }
  }

  async verifyDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const doctor = await this._doctorUseCase.verifyDoctor(doctorId);
      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = req.body;
      const newDoctor = await this._doctorUseCase.createDoctor(doctor);
      res.status(HttpStatusCode.CREATED).json(newDoctor);
    } catch (error) {
      next(error);
    }
  }

  async updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = req.params.id;
      const updates = req.body;
      if (!doctorId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const doctor = await this._doctorUseCase.updateDoctor(doctorId, updates);
      res.status(HttpStatusCode.OK).json(doctor);
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
      res.status(HttpStatusCode.OK).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.body;
      const newPatient = await this._patientUseCase.createPatient(patient);
      res.status(HttpStatusCode.CREATED).json(newPatient);
    } catch (error) {
      next(error);
    }
  }

  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.id;
      const updates = req.body;
      if (!patientId) throw new ValidationError(ResponseMessages.BAD_REQUEST);
      const patient = await this._patientUseCase.updatePatient(patientId, updates);
      res.status(HttpStatusCode.OK).json(patient);
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
      res.status(HttpStatusCode.OK).json(patient);
    } catch (error) {
      next(error);
    }
  }
}
