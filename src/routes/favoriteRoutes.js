import { Router } from "express";
import { addFavorite, listFavorites, removeFavorite } from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(protect, authorize("tenant"));
router.get("/", listFavorites);
router.post("/:propertyId", addFavorite);
router.delete("/:propertyId", removeFavorite);

export default router;
