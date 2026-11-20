import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import Enquiry from "./models/Enquiry.js";
import Favorite from "./models/Favorite.js";
import Property from "./models/Property.js";
import User from "./models/User.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { uploadDir } from "./utils/photos.js";

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("JWT_SECRET must be set to a long random string (see .env.example)");
  process.exit(1);
}

const port = Number(process.env.PORT) || 5000;

fs.mkdirSync(uploadDir(), { recursive: true });

connectDB()
  .then(() => Promise.all([User.syncIndexes(), Property.syncIndexes(), Enquiry.syncIndexes(), Favorite.syncIndexes()]))
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`NestFind API listening on http://localhost:${port}`);
    });
    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  })
  .catch((error) => {
    console.error("Failed to start NestFind API");
    console.error(error.message);
    process.exit(1);
  });