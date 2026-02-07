import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
});

export const cloudinaryService = {
    /**
     * Generates a signed URL or simply returns the public ID based URL.
     * Since we store URLs in DB, this might just be a helper to upload or transform.
     */
    getOptimizedUrl: (publicId: string, options: { width?: number; height?: number; format?: string } = {}) => {
        return cloudinary.url(publicId, {
            fetch_format: options.format || 'auto',
            quality: 'auto',
            width: options.width,
            height: options.height,
            crop: 'limit',
        });
    },

    // Admin only: Upload content
    uploadMedia: async (filePath: string, folder: string = 'shloksagar') => {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder,
                resource_type: 'auto',
            });
            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
            };
        } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            throw error;
        }
    },

    getSignature: (params: Record<string, any>) => {
        return cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
    }
};
