import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'qj9klcxi',
  api_key: process.env.CLOUDINARY_API_KEY || '869954752719738',
  api_secret: process.env.CLOUDINARY_API_SECRET || '6oyic_Z7KVLk1DjmUxxEtnOcs64',
  secure: true,
});

export async function uploadImageToCloudinary(
  fileBase64: string,
  folder = 'janbindu_issues'
): Promise<{ secure_url: string; public_id: string }> {
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
}

export default cloudinary;
