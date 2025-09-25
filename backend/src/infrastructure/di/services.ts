import { EmailService } from '../services/EmailService';
import { TokenService } from '../services/TokenService';
import { OTPService } from '../services/OTPService';
import { StripeService } from '../services/StripeService';
import { ImageUploadService } from '../services/ImageUploadService';
import { SocketService } from '../services/SocketService';
import { NotificationService } from '../services/NotificationService';
import JoiService from '../services/JOIService';

import {
  otpRepository,
  chatRepository,
  notificationRepository,
  patientRepository,
  doctorRepository,
} from './repositories';

export const emailService = new EmailService();
export const tokenService = new TokenService();
export const otpService = new OTPService(otpRepository, emailService);
export const stripeService = new StripeService();
export const imageUploadService = new ImageUploadService();
export const socketService = new SocketService(
  chatRepository,
  tokenService,
  patientRepository,
  doctorRepository,
  notificationRepository
);
export const notificationService = new NotificationService(notificationRepository, socketService);
export const validatorService = new JoiService();
