import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { IImageUploadService } from '../../core/interfaces/services/IImageUploadService';

export class ImageUploadService implements IImageUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<{ url: string; publicId: string }> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${(error as Error).message}`);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<{ url: string; publicId: string }> {
    try {
      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Allowed types: images (JPEG, PNG, GIF), PDF, DOC, DOCX');
      }

      // Validate file size (e.g., 10MB limit)
      const maxSizeBytes = Number(env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024; // Default to 10MB if not set
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds limit of ${maxSizeBytes / (1024 * 1024)}MB`);
      }

      // Upload file to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto', // Automatically detect file type (image or raw)
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete image: ${(error as Error).message}`);
    }
  }
}
