import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import geoRoutes from "./routes/geoRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFound, sanitizeRequest } from "./middleware/errorMiddleware.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { uploadProvider } from "./services/uploadService.js";
import { uploadDir } from "./utils/photos.js";

const app = express();
const origins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use("/uploads", express.static(path.resolve(uploadDir())));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uploadProvider: uploadProvider(),
      geocodingProvider: process.env.GEOCODING_PROVIDER || "nominatim",
    },
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/geo", geoRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
