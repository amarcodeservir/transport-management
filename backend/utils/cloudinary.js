import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a local file to Cloudinary (or return local path if Cloudinary is not configured)
 * @param {string} localFilePath 
 * @param {string} folder 
 * @returns {Promise<string>} Uploaded file URL or reference path
 */
export const uploadToCloudinary = async (localFilePath, folder = "transport_management") => {
  if (!localFilePath) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder,
        resource_type: "auto",
      });
      // Clean up local temp file after upload
      await fs.unlink(localFilePath).catch(() => {});
      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
    }
  }

  // Fallback: return path as-is if Cloudinary is not configured
  return localFilePath;
};

export default cloudinary;
