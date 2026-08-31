import express from "express";
import { getGithubActivity } from "../controllers/githubController.js";

const router = express.Router();

router.get("/:username", getGithubActivity);

export default router;