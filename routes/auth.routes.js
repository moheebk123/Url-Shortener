import { Router } from "express";
import {
  handleRegisterPage,
  handleLoginPage,
  handleProfilePage,
  handleEditProfilePage,
  handleSetPasswordPage,
  handleChangePasswordPage,
  handleResetPasswordPage,
  handleForgetPasswordPage,
  handleRegister,
  handleLogin,
  handleEditProfile,
  handleLogout,
  handleVerifyEmailPage,
  handleResendVerificationLink,
  handleVerifyEmail,
  handleDeleteAccount,
  handleSetPassword,
  handleChangePassword,
  handleResetPassword,
  handleForgetPassword,
  handleOAuthRedirect,
  handleOAuthCallback,
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

router
  .route("/set-password")
  .get(handleSetPasswordPage)
  .post(handleSetPassword);

router
  .route("/change-password")
  .get(handleChangePasswordPage)
  .post(handleChangePassword);

router
  .route("/reset-password")
  .get(handleResetPasswordPage)
  .post(handleResetPassword);

router
  .route("/forget-password/:resetPasswordToken")
  .get(handleForgetPasswordPage)
  .post(handleForgetPassword);

router.route("/logout").get(handleLogout);

router.route("/delete-account").post(handleDeleteAccount);

router.route("/oauth/:provider").get(handleOAuthRedirect)

router.route("/oauth-redirect/:provider/callback").get(handleOAuthCallback);

export const authRoutes = router;
