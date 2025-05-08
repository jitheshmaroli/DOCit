import express from 'express';
import { Container } from '../../infrastructure/di/container';
import { UserController } from '../controllers/user/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();
const container = Container.getInstance();

const userController = new UserController(container);

// User routes
router.get('/me', authMiddleware(container), userController.getCurrentUser.bind(userController));

export default router;