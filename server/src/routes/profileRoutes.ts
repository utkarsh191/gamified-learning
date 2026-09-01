import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  updateCachedXP,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);
router.patch("/xp", protect, updateCachedXP);

export default router;