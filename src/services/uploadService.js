import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../utils/AppError.js";
import { uploadDir } from "../utils/photos.js";

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadProvider() {
  return cloudinaryConfigured() ? "cloudinary" : "local";
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function extensionFor(file) {
  const ext = ALLOWED[file.mimetype];
  if (!ext) throw new AppError("Only JPEG, PNG, and WebP images are allowed", 400);
  return ext;
}

async function saveLocal(file) {
  const ext = extensionFor(file);
  const publicId = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), publicId), file.buffer);
  return { url: `/uploads/${publicId}`, publicId, provider: "local" };
}

function saveCloudinary(file) {
  extensionFor(file);
  configureCloudinary();
  const folder = process.env.CLOUDINARY_FOLDER || "nestfind";
  const publicId = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(new AppError("Image upload failed. Check the storage configuration.", 502));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          provider: "cloudinary",
        });
      }
    );
    stream.end(file.buffer);
  });
}

export async function saveImage(file) {
  if (!file?.buffer?.length) throw new AppError("Empty image upload", 400);
  if (file.size > 5 * 1024 * 1024) throw new AppError("Each image must be 5 MB or smaller", 400);
  if (cloudinaryConfigured()) return saveCloudinary(file);
  return saveLocal(file);
}

export async function deleteImage(photo) {
  if (!photo?.publicId || photo.provider === "external") return;
  try {
    if (photo.provider === "cloudinary" && cloudinaryConfigured()) {
      configureCloudinary();
      await cloudinary.uploader.destroy(photo.publicId);
      return;
    }
    if (photo.provider === "local") {
      await fs.unlink(path.join(uploadDir(), photo.publicId));
    }
  } catch (error) {
    console.error("Could not delete image", photo.publicId, error.message);
  }
}
