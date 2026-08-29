import express from "express";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/", protect, (req, res) => {
  console.log(req.user);
  console.log(req.body);

  res.status(200).json({
    message: "Profile data received successfully",
    profile: req.body,
  });
});

export default router;