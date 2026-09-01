import express from "express";

import { getLeetcodeActivity } from "../controllers/leetcodeController.js";

const router = express.Router();

router.get("/:username", getLeetcodeActivity);

export default router;