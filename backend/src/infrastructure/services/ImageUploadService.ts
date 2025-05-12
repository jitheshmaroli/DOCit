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

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete image: ${(error as Error).message}`);
    }
  }
}
