import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: 'auto',
      });
      return result.secure_url;
    } catch (error) {
      throw new Error('Failed to upload image to Cloudinary');
    }
  }
}