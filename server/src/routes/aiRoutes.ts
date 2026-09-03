import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { chatWithAI, analyzeProgress } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", protect, chatWithAI);
router.post("/analyze", protect, analyzeProgress);

export default router;