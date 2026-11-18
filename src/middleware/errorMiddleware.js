import { AppError } from "../utils/AppError.js";

function sanitizeInPlace(value) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
      continue;
    }
    if (typeof value[key] === "object") sanitizeInPlace(value[key]);
  }
}

export function sanitizeRequest(req, _res, next) {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.params);
  sanitizeInPlace(req.query);
  next();
}

export function notFound(_req, _res, next) {
  next(new AppError("The requested resource was not found", 404));
}

export function errorHandler(err, _req, res, _next) {
  if (err?.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message = field === "email" ? "An account with this email already exists" : "This record already exists";
    return res.status(409).json({ success: false, message });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Something went wrong. Please try again." : err.message,
  });
}
