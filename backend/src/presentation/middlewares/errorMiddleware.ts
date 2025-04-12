import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../../utils/errors';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
  } else {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: 'Something went wrong on the server',
    });
  }
};
