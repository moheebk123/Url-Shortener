import { Router } from "express";
import * as authController from "../controllers/index.controller.js";

const router = Router();

router
  .route("/register")
  .get(authController.handleRegisterPage)
  .post(authController.handleRegister);

router
  .route("/verify-email")
  .get(authController.handleVerifyEmailPage)
  .post(authController.handleVerifyEmail);

router
  .route("/resend-verification-link")
  .get(authController.handleResendVerificationLink);

router
  .route("/login")
  .get(authController.handleLoginPage)
  .post(authController.handleLogin);

router
  .route("/reset-password")
  .get(authController.handleResetPasswordPage)
  .post(authController.handleResetPassword);

router
  .route("/forget-password/:resetPasswordToken")
  .get(authController.handleForgetPasswordPage)
  .post(authController.handleForgetPassword);

router.route("/logout").get(authController.handleLogout);

export const authRoutes = router;
