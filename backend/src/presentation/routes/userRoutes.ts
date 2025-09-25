import express from 'express';
import createControllers from '../../infrastructure/di/controllers';
import createMiddlewares from '../../infrastructure/di/middlewares';

const router = express.Router();

const { userController } = createControllers();
const { authMiddleware } = createMiddlewares();

const userAuth = [authMiddleware.exec];

// User routes
router.get('/me', userAuth, userController.getCurrentUser.bind(userController));
router.get('/:userId', userAuth, userController.getUser.bind(userController));

export default router;
