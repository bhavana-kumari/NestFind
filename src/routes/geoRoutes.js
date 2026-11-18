import { Router } from "express";
import { reverseGeo, searchGeo } from "../controllers/geoController.js";
import { geoLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { geoReverseSchema, geoSearchSchema } from "../validators/schemas.js";

const router = Router();

router.get("/search", geoLimiter, validate(geoSearchSchema), searchGeo);
router.get("/reverse", geoLimiter, validate(geoReverseSchema), reverseGeo);

export default router;
