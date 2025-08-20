import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { IImageUploadService } from '../../core/interfaces/services/IImageUploadService';
import logger from '../../utils/logger';

export class ImageUploadService implements IImageUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      signature_algorithm: 'sha256', // Ensure SHA-256 if required
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<{ url: string; publicId: string }> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        access_mode: 'public',
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
      const maxSizeBytes = Number(env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024; // Default to 10MB
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds limit of ${maxSizeBytes / (1024 * 1024)}MB`);
      }

      // Set access_mode to 'authenticated' for PDFs in 'doctor-proofs' folder
      const accessMode = folder === 'doctor-proofs' ? 'authenticated' : 'public';
      const resourceType = folder === 'doctor-proofs' ? 'raw' : 'auto';

      // Upload file to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: resourceType,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        access_mode: accessMode,
      });

      logger.info('result image upload file:', result);

      // Generate signed URL for authenticated resources
      // let url = result.secure_url;
      // if (accessMode === 'authenticated') {
      //   const timestamp = Math.round(new Date().getTime() / 1000);
      //   const signature = cloudinary.utils.api_sign_request(
      //     { public_id: result.public_id, timestamp: timestamp },
      //     env.CLOUDINARY_API_SECRET
      //   );
      //   logger.info(
      //     `String to sign (uploadFile): public_id=${result.public_id}, timestamp=${timestamp}, signature=${signature}`
      //   );
      //   const baseUrl = cloudinary.utils.private_download_url(result.public_id, result.format, {
      //     resource_type: 'raw',
      //     attachment: false,
      //   });
      //   url = `${baseUrl}&timestamp=${timestamp}&signature=${signature}`;
      // }

      return {
        url: result.secure_url, // Return base URL without query parameters
        publicId: result.public_id,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      throw new Error(`Failed to delete image: ${(error as Error).message}`);
    }
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'raw'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }
}
