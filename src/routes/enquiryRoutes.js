import { Router } from "express";
import { createEnquiry, myEnquiries, receivedEnquiries, updateEnquiryStatus } from "../controllers/enquiryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { enquirySchema, enquiryStatusSchema } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.post("/", authorize("tenant"), validate(enquirySchema), createEnquiry);
router.get("/my-enquiries", authorize("tenant"), myEnquiries);
router.get("/received", authorize("owner"), receivedEnquiries);
router.patch("/:id/status", validate(enquiryStatusSchema), updateEnquiryStatus);

export default router;
