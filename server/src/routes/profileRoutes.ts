import express from "express";

const router = express.Router();

router.put("/", (req, res) => {
  console.log(req.body);

  res.status(200).json({
    message: "Profile data received successfully",
    profile: req.body,
  });
});

export default router;