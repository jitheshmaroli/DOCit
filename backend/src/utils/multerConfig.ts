import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ValidationError } from './errors';

export const getMulterUploader = (subfolder: string, fileType: 'image' | 'pdf' | 'image-and-pdf' = 'image') => {
  const uploadDir = path.join(os.tmpdir(), `/uploads/${subfolder}`);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (fileType === 'image') {
      const allowedTypes = /jpeg|jpg|png/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname && mimetype) return cb(null, true);
      return cb(new ValidationError('Only images (jpeg, jpg, png) are allowed'));
    } else if (fileType === 'pdf') {
      const allowedTypes = /pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype === 'application/pdf';
      if (extname && mimetype) return cb(null, true);
      return cb(new ValidationError('Only PDF files are allowed'));
    } else if (fileType === 'image-and-pdf') {
      // Check based on fieldname
      if (file.fieldname === 'profilePicture') {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        return cb(new ValidationError('Profile picture must be an image (jpeg, jpg, png)'));
      } else if (file.fieldname === 'licenseProof') {
        const allowedTypes = /pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype === 'application/pdf';
        if (extname && mimetype) return cb(null, true);
        return cb(new ValidationError('License proof must be a PDF file'));
      }
    }
    return cb(new ValidationError('Invalid field name'));
  };

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
  });
};
