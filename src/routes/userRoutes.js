import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validators/schemas.js";

const router = Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(profileSchema), updateProfile);

export default router;
