import * as Cloudinary from "cloudinary";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { env } from "./environments";

export const cloudinary = Cloudinary.v2;

const { CLOUDINARY_KEY, CLOUDINARY_NAME, CLOUDINARY_SECRET } = env;

const options: Cloudinary.ConfigOptions = {
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
};

cloudinary.config(options);

// Multer configuration
const storage = multer.memoryStorage(); // Store file in memory as buffer

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.match(/^image\/(jpe?g|png|webp)$/)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, webp) are allowed!"));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Function to upload an image
export const uploadImage = (
  file: Express.Multer.File,
  options?: Cloudinary.UploadApiOptions
): Promise<Cloudinary.UploadApiResponse> => {
  return new Promise(async (resolve, reject) => {
    // Convert file to buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(new Error(`Upload failed: ${error.message}`));
        }

        if (!result) {
          const err = new Error("Cloudinary upload returned undefined result");
          console.error(err);
          return reject(err);
        }
        resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Function to delete an image
export const deleteImage = async (
  publicId: string
): Promise<Cloudinary.DeleteApiResponse> => {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    if (res.result !== "ok") {
      throw new Error(`Failed to delete image: ${publicId}`);
    }
    return res;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

// Function to delete all images
export const deleteAllImages = async (
  publicIds: string[]
): Promise<Cloudinary.DeleteApiResponse[]> => {
  try {
    const deletePromises = publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId)
    );

    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete images from Cloudinary");
  }
};

// Function to delete all assets in a folder
const deleteAssetsInFolder = async (folderPath: string): Promise<void> => {
  try {
    // List all assets in the folder
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 500, // Adjust based on the number of assets
    });

    // Extract public IDs of all assets
    const publicIds = result.resources.map(
      (resource: any) => resource.public_id
    );

    // Delete all assets
    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds);
      console.log(
        `Deleted ${publicIds.length} assets from folder: ${folderPath}`
      );
    } else {
      console.log(`No assets found in folder: ${folderPath}`);
    }
  } catch (error) {
    console.error("Error deleting assets in folder:", error);
    throw new Error("Failed to delete assets in folder");
  }
};

// Function to delete a folder and its contents
export const deleteFolder = async (folderPath: string): Promise<void> => {
  try {
    // Delete all assets in the folder
    await deleteAssetsInFolder(folderPath);

    // Delete the folder itself
    await cloudinary.api.delete_folder(folderPath);
    console.log(`Successfully deleted folder: ${folderPath}`);
  } catch (error) {
    console.error("Cloudinary folder delete error:", error);
    throw new Error("Failed to delete folder from Cloudinary");
  }
};
