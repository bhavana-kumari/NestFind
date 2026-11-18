import multer from "multer";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { saveImage, uploadProvider } from "../services/uploadService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 400));
      return;
    }
    callback(null, true);
  },
});

export function uploadPhotos(req, res, next) {
  upload.array("photos", 8)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE" ? "Each image must be 5 MB or smaller" : "You can upload up to 8 images";
      return next(new AppError(message, 400));
    }
    return next(error);
  });
}

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new AppError("Choose at least one image", 400);
  const photos = [];
  for (const file of req.files) {
    photos.push(await saveImage(file));
  }
  res.status(201).json({ success: true, data: { photos, provider: uploadProvider() } });
});
