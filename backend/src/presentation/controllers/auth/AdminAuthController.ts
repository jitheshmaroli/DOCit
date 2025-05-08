import { Request, Response, NextFunction } from 'express';
import { Container } from '../../../infrastructure/di/container';
import { ValidationError } from '../../../utils/errors';
import { UpdateDoctorUseCase } from '../../../core/use-cases/admin/UpdateDoctorUseCase';
import { DeleteDoctorUseCase } from '../../../core/use-cases/admin/DeleteDoctorUseCase';
import { BlockDoctorUseCase } from '../../../core/use-cases/admin/BlockDoctorUseCase';
import { UpdatePatientUseCase } from '../../../core/use-cases/admin/UpdatePatientUseCase';
import { DeletePatientUseCase } from '../../../core/use-cases/admin/DeletePatientUseCase';
import { BlockPatientUseCase } from '../../../core/use-cases/admin/BlockPatientUseCase';
import { CreateDoctorUseCase } from '../../../core/use-cases/admin/CreateDoctorUseCase';
import { CreatePatientUseCase } from '../../../core/use-cases/admin/CreatePatientUseCase';
import { setTokensInCookies } from '../../../utils/cookieUtils';
import { ListPatientsUseCase } from '../../../core/use-cases/admin/ListPatientsUseCase';
import { ListDoctorsUseCase } from '../../../core/use-cases/admin/ListDoctorsUseCase';
import { VerifyDoctorUseCase } from '../../../core/use-cases/admin/VerifyDoctorUseCase';
import { LoginAdminUseCase } from '../../../core/use-cases/auth/admin/LoginAdminUseCase';
import { PaginatedResponse, QueryParams } from '../../../types/authTypes';

export class AdminAuthController {
  private loginAdminUseCase: LoginAdminUseCase;
  private createDoctorUseCase: CreateDoctorUseCase;
  private listPatientsUseCase: ListPatientsUseCase;
  private listDoctorsUseCase: ListDoctorsUseCase;
  private verifyDoctorUseCase: VerifyDoctorUseCase;
  private updateDoctorUseCase: UpdateDoctorUseCase;
  private deleteDoctorUseCase: DeleteDoctorUseCase;
  private blockDoctorUseCase: BlockDoctorUseCase;
  private createPatientUseCase: CreatePatientUseCase;
  private updatePatientUseCase: UpdatePatientUseCase;
  private deletePatientUseCase: DeletePatientUseCase;
  private blockPatientUseCase: BlockPatientUseCase;

  constructor(container: Container) {
    this.loginAdminUseCase = container.get('LoginAdminUseCase');
    this.listPatientsUseCase = container.get('ListPatientsUseCase');
    this.listDoctorsUseCase = container.get('ListDoctorsUseCase');
    this.verifyDoctorUseCase = container.get('VerifyDoctorUseCase');
    this.updateDoctorUseCase = container.get('UpdateDoctorUseCase');
    this.deleteDoctorUseCase = container.get('DeleteDoctorUseCase');
    this.blockDoctorUseCase = container.get('BlockDoctorUseCase');
    this.updatePatientUseCase = container.get('UpdatePatientUseCase');
    this.deletePatientUseCase = container.get('DeletePatientUseCase');
    this.blockPatientUseCase = container.get('BlockPatientUseCase');
    this.createDoctorUseCase = container.get('CreateDoctorUseCase');
    this.createPatientUseCase = container.get('CreatePatientUseCase');
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        throw new ValidationError('Email and password are required');
      const { accessToken, refreshToken } =
        await this.loginAdminUseCase.execute(email, password);
      setTokensInCookies(res, accessToken, refreshToken);
      res.status(200).json({ message: 'Logged in successfully' });
    } catch (error) {
      next(error);
    }
  }

  async listPatients(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params: QueryParams = req.query as any;
      const { data: patients, totalItems } =
        await this.listPatientsUseCase.executeWithQuery(params);
      const { page = 1, limit = 10 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(200).json({
        data: patients,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<any>);
    } catch (error) {
      next(error);
    }
  }

  async createDoctor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doctor = req.body;
      const newDoctor = await this.createDoctorUseCase.execute(doctor);
      res.status(201).json(newDoctor);
    } catch (error) {
      next(error);
    }
  }

  async listDoctors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params: QueryParams = req.query as any;
      const { data: doctors, totalItems } =
        await this.listDoctorsUseCase.executeWithQuery(params);
      const { page = 1, limit = 5 } = params;
      const totalPages = Math.ceil(totalItems / limit);

      res.status(200).json({
        data: doctors,
        totalPages,
        currentPage: page,
        totalItems,
      } as PaginatedResponse<any>);
    } catch (error) {
      next(error);
    }
  }

  async verifyDoctor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { doctorId } = req.params;
      if (!doctorId) throw new ValidationError('Doctor ID is required');
      const doctor = await this.verifyDoctorUseCase.execute(doctorId);
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async updateDoctor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (!id) throw new ValidationError('Doctor ID is required');
      const doctor = await this.updateDoctorUseCase.execute(id, updates);
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async deleteDoctor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError('Doctor ID is required');
      await this.deleteDoctorUseCase.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async blockDoctor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { isBlocked } = req.body;
      if (!id || typeof isBlocked !== 'boolean')
        throw new ValidationError(
          'Doctor ID and isBlocked (boolean) are required'
        );
      const doctor = await this.blockDoctorUseCase.execute(id, isBlocked);
      res.status(200).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async createPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const patient = req.body;
      const newPatient = await this.createPatientUseCase.execute(patient);
      res.status(201).json(newPatient);
    } catch (error) {
      next(error);
    }
  }

  async updatePatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (!id) throw new ValidationError('Patient ID is required');
      const patient = await this.updatePatientUseCase.execute(id, updates);
      res.status(200).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async deletePatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) throw new ValidationError('Patient ID is required');
      await this.deletePatientUseCase.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async blockPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { isBlocked } = req.body;
      if (!id || typeof isBlocked !== 'boolean')
        throw new ValidationError(
          'Patient ID and isBlocked (boolean) are required'
        );
      const patient = await this.blockPatientUseCase.execute(id, isBlocked);
      res.status(200).json(patient);
    } catch (error) {
      next(error);
    }
  }
}
