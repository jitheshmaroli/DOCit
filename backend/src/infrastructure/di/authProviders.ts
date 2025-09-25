import { EmailAuthProvider } from '../services/auth-providers/EmailAuthProvider';
import { GoogleAuthProvider } from '../services/auth-providers/GoogleAuthProvider';
import { patientRepository, doctorRepository, adminRepository } from './repositories';
import { validatorService } from './services';

export const authProviders = {
  email: new EmailAuthProvider(patientRepository, doctorRepository, adminRepository, validatorService),
  google: new GoogleAuthProvider(patientRepository, doctorRepository, validatorService),
};
