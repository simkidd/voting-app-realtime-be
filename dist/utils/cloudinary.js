"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolder = exports.deleteAllImages = exports.deleteImage = exports.uploadImage = exports.uploadMiddleware = exports.cloudinary = void 0;
const Cloudinary = __importStar(require("cloudinary"));
const multer_1 = __importDefault(require("multer"));
const environments_1 = require("./environments");
exports.cloudinary = Cloudinary.v2;
const { CLOUDINARY_KEY, CLOUDINARY_NAME, CLOUDINARY_SECRET } = environments_1.env;
const options = {
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
};
exports.cloudinary.config(options);
// Multer configuration
const storage = multer_1.default.memoryStorage(); // Store file in memory as buffer
const fileFilter = (req, file, cb) => {
    if (file.mimetype.match(/^image\/(jpe?g|png|webp)$/)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files (jpg, png, webp) are allowed!"));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
// Function to upload an image
const uploadImage = (file, options) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        // Convert file to buffer
        const uploadStream = exports.cloudinary.uploader.upload_stream(options, (error, result) => {
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
        });
        uploadStream.end(file.buffer);
    }));
};
exports.uploadImage = uploadImage;
// Function to delete an image
const deleteImage = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield exports.cloudinary.uploader.destroy(publicId);
        if (res.result !== "ok") {
            throw new Error(`Failed to delete image: ${publicId}`);
        }
        return res;
    }
    catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
});
exports.deleteImage = deleteImage;
// Function to delete all images
const deleteAllImages = (publicIds) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletePromises = publicIds.map((publicId) => exports.cloudinary.uploader.destroy(publicId));
        const results = yield Promise.all(deletePromises);
        return results;
    }
    catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new Error("Failed to delete images from Cloudinary");
    }
});
exports.deleteAllImages = deleteAllImages;
// Function to delete all assets in a folder
const deleteAssetsInFolder = (folderPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // List all assets in the folder
        const result = yield exports.cloudinary.api.resources({
            type: "upload",
            prefix: folderPath,
            max_results: 500, // Adjust based on the number of assets
        });
        // Extract public IDs of all assets
        const publicIds = result.resources.map((resource) => resource.public_id);
        // Delete all assets
        if (publicIds.length > 0) {
            yield exports.cloudinary.api.delete_resources(publicIds);
            console.log(`Deleted ${publicIds.length} assets from folder: ${folderPath}`);
        }
        else {
            console.log(`No assets found in folder: ${folderPath}`);
        }
    }
    catch (error) {
        console.error("Error deleting assets in folder:", error);
        throw new Error("Failed to delete assets in folder");
    }
});
// Function to delete a folder and its contents
const deleteFolder = (folderPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete all assets in the folder
        yield deleteAssetsInFolder(folderPath);
        // Delete the folder itself
        yield exports.cloudinary.api.delete_folder(folderPath);
        console.log(`Successfully deleted folder: ${folderPath}`);
    }
    catch (error) {
        console.error("Cloudinary folder delete error:", error);
        throw new Error("Failed to delete folder from Cloudinary");
    }
});
exports.deleteFolder = deleteFolder;
