import fs from "fs";
import path from "path";
import { AppError } from "./AppError.js";

export function uploadDir() {
  return path.resolve(process.cwd(), "uploads");
}

export function assertPhotos(photos = [], existing = []) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const retained = new Set(existing.map((photo) => `${photo.provider}:${photo.publicId}:${photo.url}`));
  for (const photo of photos) {
    if (photo.provider === "external") {
      if (!retained.has(`external:${photo.publicId}:${photo.url}`)) {
        throw new AppError("Unsupported photo source.", 400);
      }
      continue;
    }
    if (photo.provider === "local") {
      const safeName = /^[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i.test(photo.publicId);
      if (!safeName || photo.url !== `/uploads/${photo.publicId}`) {
        throw new AppError("One of the photos is invalid. Upload it again.", 400);
      }
      const fullPath = path.resolve(uploadDir(), photo.publicId);
      if (!fullPath.startsWith(uploadDir() + path.sep) || !fs.existsSync(fullPath)) {
        throw new AppError("An uploaded photo could not be found. Upload it again.", 400);
      }
      continue;
    }

    if (photo.provider === "cloudinary") {
      if (!cloudName || !photo.url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
        throw new AppError("Cloud photo storage is not configured for this image.", 400);
      }
      if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?$/.test(photo.publicId || "")) {
        throw new AppError("One of the photos is invalid. Upload it again.", 400);
      }
      continue;
    }

    throw new AppError("Unsupported photo source.", 400);
  }
}
