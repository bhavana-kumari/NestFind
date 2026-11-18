import dotenv from "dotenv";
import fs from "fs";
import Enquiry from "./models/Enquiry.js";
import Favorite from "./models/Favorite.js";
import Property from "./models/Property.js";
import User from "./models/User.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { uploadDir } from "./utils/photos.js";

dotenv.config();

const port = Number(process.env.PORT) || 5000;

fs.mkdirSync(uploadDir(), { recursive: true });

connectDB()
  .then(() => Promise.all([User.syncIndexes(), Property.syncIndexes(), Enquiry.syncIndexes(), Favorite.syncIndexes()]))
  .then(() => {
    app.listen(port, () => {
      console.log(`NestFind API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start NestFind API");
    console.error(error.message);
    process.exit(1);
  });
