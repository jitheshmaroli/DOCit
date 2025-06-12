import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../../utils/errors';
import logger from '../../utils/logger';
import multer from 'multer';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(`Error in ${req.method} ${req.url}`, {
    error: err.message,
    name: err.name,
    stack: err.stack,
    ip: req.ip,
  });

  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
    });
  } else if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'TokenExpiredError',
      message: 'Access token has expired',
    });
  } else if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'JsonWebTokenError',
      message: 'Invalid token',
    });
  } else if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: 'MulterError',
      message: `File upload error: ${err.message}`,
    });
  } else if (err.message === 'Only images (jpeg, jpg, png) are allowed') {
    res.status(400).json({
      success: false,
      error: 'InvalidFileType',
      message: err.message,
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: 'Something went wrong on the server',
    });
  }
  next();
};
