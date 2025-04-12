import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { PatientController } from '../../controllers/patient/PatientController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { PatientProfileController } from '../../controllers/patient/PatientProfileController';
import { getMulterUploader } from '../../../utils/multerConfig';

const router = express.Router();
const container = Container.getInstance();

const patientController = new PatientController(container);
const patientProfileController = new PatientProfileController(container);

const upload = getMulterUploader('patient-profiles');

const patientAuth = [authMiddleware(container), roleMiddleware(['patient'])];

// Routes for patient profile operations (view/update)
router
  .route('/:id')
  .get(
    patientAuth,
    patientProfileController.viewProfile.bind(patientProfileController)
  )
  .patch(
    patientAuth,
    upload.single('profilePicture'),
    patientProfileController.updateProfile.bind(patientProfileController)
  );

// Route for viewing doctor slot availabilty
router.get(
  '/doctors/:doctorId/availability',
  patientAuth,
  patientController.getDoctorAvailability.bind(patientController)
);

// Route for booking doctor appointment
router.post(
  '/appointments',
  patientAuth,
  patientController.bookAppointment.bind(patientController)
);

export default router;
