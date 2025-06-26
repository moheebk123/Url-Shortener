import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleRegisterPage,
  handleLoginPage,
  handleProfilePage,
  handleLogout,
  handleVerifyEmailPage,
  handleResendVerificationLink,
  handleVerifyEmail
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/register", handleRegisterPage);

router.post("/register", handleRegister);

router.route("/login").get(handleLoginPage).post(handleLogin)

router.route("/verify-email").get(handleVerifyEmailPage).post(handleVerifyEmail)

router.route("/resend-verification-link").get(handleResendVerificationLink);

router.route("/profile").get(handleProfilePage);

router.route("/logout").get(handleLogout);

export const authRoutes = router;
