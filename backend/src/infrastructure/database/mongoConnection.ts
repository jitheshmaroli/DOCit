import mongoose from 'mongoose';
import logger from '../../utils/logger';

export const connectMongoDB = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};
