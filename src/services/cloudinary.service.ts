import { cloudinary } from '../config/cloudinary';

export const cloudinaryService = {
    getOptimizedUrl: (publicId: string, options: { width?: number; height?: number; format?: string } = {}) => {
        return cloudinary.url(publicId, {
            fetch_format: options.format || 'auto',
            quality: 'auto',
            width: options.width,
            height: options.height,
            crop: 'limit',
        });
    },

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
        const apiSecret = process.env.CLOUDINARY_API_SECRET!;
        return cloudinary.utils.api_sign_request(params, apiSecret);
    }
};
