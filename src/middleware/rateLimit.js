import rateLimit from "express-rate-limit";

function jsonHandler(message) {
  return (_req, res) => {
    res.status(429).json({ success: false, message });
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please try again later."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many attempts. Please wait a few minutes and try again."),
});

export const geoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many location searches. Please wait a moment or pick a point on the map."),
});
