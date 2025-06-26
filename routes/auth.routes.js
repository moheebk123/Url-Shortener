import { Router } from "express";
import {
  handleRegisterPage,
  handleLoginPage,
  handleProfilePage,
  handleEditProfilePage,
  handleRegister,
  handleLogin,
  handleEditProfile,
  handleLogout,
  handleVerifyEmailPage,
  handleResendVerificationLink,
  handleVerifyEmail,
  handleDeleteAccount
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/register", handleRegisterPage);

router.post("/register", handleRegister);

router.route("/login").get(handleLoginPage).post(handleLogin)

router.route("/verify-email").get(handleVerifyEmailPage).post(handleVerifyEmail)

router.route("/resend-verification-link").get(handleResendVerificationLink);

router.route("/profile").get(handleProfilePage);

router
  .route("/edit-profile")
  .get(handleEditProfilePage)
  .post(handleEditProfile);

router.route("/logout").get(handleLogout);

router.route("/delete-account").post(handleDeleteAccount);

export const authRoutes = router;
