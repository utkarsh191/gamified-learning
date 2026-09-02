import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMessages, createMessage } from "../controllers/messageController.js";

const router = express.Router();

router.get("/", protect, getMessages);
router.post("/", protect, createMessage);

export default router;