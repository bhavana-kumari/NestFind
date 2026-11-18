import { Router } from "express";
import {
  addProperty,
  changeStatus,
  editProperty,
  getProperty,
  listProperties,
  myListings,
  removeProperty,
} from "../controllers/propertyController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, propertyBodySchema, propertyStatusSchema, searchQuerySchema } from "../validators/schemas.js";

const router = Router();

router.get("/my-listings", protect, authorize("owner"), myListings);
router.patch("/:id/status", protect, authorize("owner"), validate(propertyStatusSchema), changeStatus);
router.get("/", optionalAuth, validate(searchQuerySchema), listProperties);
router.get("/:id", optionalAuth, validate(idParamSchema), getProperty);
router.post("/", protect, authorize("owner"), validate(propertyBodySchema), addProperty);
router.put("/:id", protect, authorize("owner"), validate(idParamSchema.merge(propertyBodySchema)), editProperty);
router.delete("/:id", protect, authorize("owner"), validate(idParamSchema), removeProperty);

export default router;
