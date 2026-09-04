import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  initiateSignup,
  verifySignupOtp,
  resendSignupOtp,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/signup/initiate", initiateSignup);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/signup/resend-otp", resendSignupOtp);

export default router;