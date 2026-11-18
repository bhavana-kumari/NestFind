import { Router } from "express";
import { uploadImages, uploadPhotos } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", protect, authorize("owner"), uploadPhotos, uploadImages);

export default router;
