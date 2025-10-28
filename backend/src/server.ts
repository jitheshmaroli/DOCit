import express, { NextFunction, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as HttpServer } from 'http';
import { connectMongoDB } from './infrastructure/database/mongoConnection';
import createMiddlewares from './infrastructure/di/middlewares';
import { socketService, cronService } from './infrastructure/di/services';
import authRoutes from './presentation/routes/authRoutes';
import adminRoutes from './presentation/routes/adminRoutes';
import doctorRoutes from './presentation/routes/doctorRoutes';
import patientRoutes from './presentation/routes/patientRoutes';
import otpRoutes from './presentation/routes/otpRoutes';
import userRoutes from './presentation/routes/userRoutes';
import chatRoutes from './presentation/routes/chatRoutes';
import notificationRoutes from './presentation/routes/notificationRoutes';
import webhookRoutes from './presentation/routes/webhookRoutes';
import { env } from './config/env';
import logger from './utils/logger';
import { CustomRequest } from './types';

const app = express();
const server = new HttpServer(app);
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;
const CLIENT_URL = env.CLIENT_URL;

// Initialize Socket.IO
socketService.initialize(server);

// Middleware setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);
app.use('/api/webhook', webhookRoutes);
app.use(express.json());
app.use(cookieParser());
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, { ip: req.ip });
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/user', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (req: CustomRequest, res: Response) => {
  logger.info('Root endpoint accessed');
  res.send('Doctor Appointment Booking App');
});

// Error middleware
const { errorHandler } = createMiddlewares();
app.use(errorHandler.exec.bind(errorHandler));

// Start server
const startServer = async () => {
  try {
    await connectMongoDB(MONGO_URI);
    cronService.start();
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT} env: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
