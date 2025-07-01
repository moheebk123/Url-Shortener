import { handleRoot, handleAbout, handleAllLinks } from "./pages.controller.js";

import {
  addShortenedUrl,
  redirectToUrl,
  handleEditUrlShortener,
  handleEditUrlShortenerPage,
  handleDeleteUrlShortener,
} from "./url.controller.js";

import {
  handleEditProfile,
  handleDeleteAccount,
  handleSetPassword,
  handleChangePassword,
} from "./user.controller.js";

import {
  handleUserLinks,
  handleProfilePage,
  handleEditProfilePage,
  handleSetPasswordPage,
  handleChangePasswordPage,
} from "./userPages.controller.js";

import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleResendVerificationLink,
  handleVerifyEmail,
  handleResetPassword,
  handleForgetPassword,
} from "./auth.controller.js";

import {
  handleRegisterPage,
  handleLoginPage,
  handleVerifyEmailPage,
  handleResetPasswordPage,
  handleForgetPasswordPage,
} from "./authPages.controller.js";

import {
  handleOAuthRedirect,
  handleOAuthCallback,
} from "./oauth.controller.js";

export {
  handleRoot,
  handleAbout,
  handleAllLinks,
  addShortenedUrl,
  redirectToUrl,
  handleEditUrlShortener,
  handleEditUrlShortenerPage,
  handleDeleteUrlShortener,
  handleEditProfile,
  handleDeleteAccount,
  handleSetPassword,
  handleChangePassword,
  handleUserLinks,
  handleProfilePage,
  handleEditProfilePage,
  handleSetPasswordPage,
  handleChangePasswordPage,
  handleRegister,
  handleLogin,
  handleLogout,
  handleResendVerificationLink,
  handleVerifyEmail,
  handleResetPassword,
  handleForgetPassword,
  handleRegisterPage,
  handleLoginPage,
  handleVerifyEmailPage,
  handleResetPasswordPage,
  handleForgetPasswordPage,
  handleOAuthRedirect,
  handleOAuthCallback,
};
