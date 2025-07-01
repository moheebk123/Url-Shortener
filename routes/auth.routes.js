import { Router } from "express";
import {
  handleRegisterPage,
  handleVerifyEmailPage,
  handleLoginPage,
  handleResetPasswordPage,
  handleForgetPasswordPage,
  handleRegister,
  handleVerifyEmail,
  handleResendVerificationLink,
  handleLogin,
  handleLogout,
  handleResetPassword,
  handleForgetPassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.route("/register").get(handleRegisterPage).post(handleRegister);

router
  .route("/verify-email")
  .get(handleVerifyEmailPage)
  .post(handleVerifyEmail);

router.route("/resend-verification-link").get(handleResendVerificationLink);

router.route("/login").get(handleLoginPage).post(handleLogin);

router
  .route("/reset-password")
  .get(handleResetPasswordPage)
  .post(handleResetPassword);

router
  .route("/forget-password/:resetPasswordToken")
  .get(handleForgetPasswordPage)
  .post(handleForgetPassword);

router.route("/logout").get(handleLogout);

export const authRoutes = router;
