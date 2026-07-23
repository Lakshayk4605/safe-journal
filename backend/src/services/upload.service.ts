import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface UploadResult {
  url: string;
  publicId: string;
  mimeType: string;
  sizeBytes: number;
}

export const uploadService = {
  async uploadBuffer(buffer: Buffer, options: { folder: string; resourceType: 'image' | 'video' | 'auto'; mimeType: string }): Promise<UploadResult> {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw ApiError.internal('File storage is not configured on this server');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: options.folder, resource_type: options.resourceType },
        (error, result) => {
          if (error || !result) {
            return reject(ApiError.internal('File upload failed', error));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            mimeType: options.mimeType,
            sizeBytes: result.bytes,
          });
        },
      );
      uploadStream.end(buffer);
    });
  },

  async deleteAsset(publicId: string, resourceType: 'image' | 'video' | 'auto' = 'auto') {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  },
};
