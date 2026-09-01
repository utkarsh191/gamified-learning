import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  pingActivity,
  getActivity,
  getHeatmapCache,
  saveHeatmapCache,
} from "../controllers/activityController.js";

const router = express.Router();

router.post("/ping", protect, pingActivity);
router.get("/", protect, getActivity);

// NEW — heatmap cache endpoints
router.get("/heatmap", protect, getHeatmapCache);
router.put("/heatmap", protect, saveHeatmapCache);

export default router;