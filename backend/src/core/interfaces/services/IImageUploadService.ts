export interface IImageUploadService {
  uploadImage(file: Express.Multer.File, folder: string): Promise<{ url: string; publicId: string }>;
  uploadFile(file: Express.Multer.File, folder: string): Promise<{ url: string; publicId: string }>;
  deleteImage(publicId: string): Promise<void>;
  uploadPDF(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }>;
}
