import dotenv from "dotenv";

dotenv.config();

export const env = {
  MONGO_URI: process.env.MONGO_URI || "",
  PORT: parseInt(process.env.PORT || ""),
  BASE_URL: process.env.BASE_URL || "",
  CLIENT_URL: process.env.CLIENT_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "secret-key",
  NODE_ENV: process.env.NODE_ENV || "",
  
  COOKIE_NAME: "__voting_cookie",

  CLOUDINARY_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_API_SECRET,
};
