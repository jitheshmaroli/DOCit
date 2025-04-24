import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectMongoDB } from './infrastructure/database/mongoConnection';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';
import authRoutes from './presentation/routes/authRoutes';
import adminRoutes from './presentation/routes/adminRoutes';
import doctorRoutes from './presentation/routes/doctorRoutes';
import patientRoutes from './presentation/routes/patientRoutes';
import otpRoutes from './presentation/routes/otpRoutes';
import userRoutes from './presentation/routes/userRoutes';
import { env } from './config/env';

const app = express();
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;
const CLIENT_URL = env.CLIENT_URL;

// Middleware setup
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/user', userRoutes);
app.use('/api/otp', otpRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Doctor Appointment Booking App');
});

// Error middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    await connectMongoDB(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
