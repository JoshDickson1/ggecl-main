import multer from "multer";
import streamifier from "streamifier";
import { cloudinary } from "../cloudinary.js";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper to upload buffer to Cloudinary

export const handleUploadFile = async (fileBuffer: Buffer, folder: string) => {
  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw", // For raw files like .docx, .ppt, pdf, etc.
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
