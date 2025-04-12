import express from 'express';
import { Container } from '../../../infrastructure/di/container';
import { DoctorController } from '../../controllers/doctor/DoctorController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { roleMiddleware } from '../../middlewares/roleMiddleware';
import { DoctorProfileController } from '../../controllers/doctor/DoctorProfileController';
import { getMulterUploader } from '../../../utils/multerConfig';

const router = express.Router();
const container = Container.getInstance();

const doctorController = new DoctorController(container);
const doctorProfileController = new DoctorProfileController(container);

const upload = getMulterUploader('doctor-profiles');

const authDoctor = [authMiddleware(container), roleMiddleware(['doctor'])];

// Routes for doctor profile operations (view/update)
router
  .route('/:id')
  .get(
    authDoctor,
    doctorProfileController.viewProfile.bind(doctorProfileController)
  )
  .patch(
    authDoctor,
    upload.single('profilePicture'),
    doctorProfileController.updateProfile.bind(doctorProfileController)
  );

// Routes for doctor availability operations (view/update)
router
  .route('/availability')
  .post(authDoctor, doctorController.setAvailability.bind(doctorController))
  .get(authDoctor, doctorController.getAvailability.bind(doctorController));

export default router;
