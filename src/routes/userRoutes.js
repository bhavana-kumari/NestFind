import { Router } from "express";
import { changePassword, getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { passwordSchema, profileSchema } from "../validators/schemas.js";

const router = Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(profileSchema), updateProfile);

router.put("/password", protect, validate(passwordSchema), changePassword);

export default router;