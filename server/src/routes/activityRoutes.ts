import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { pingActivity, getActivity } from "../controllers/activityController.js";

const router = express.Router();

router.post("/ping", protect, pingActivity);
router.get("/", protect, getActivity);

export default router;