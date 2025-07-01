import { Router } from "express";

import {
  handleProfilePage,
  handleEditProfilePage,
  handleSetPasswordPage,
  handleChangePasswordPage,
  handleEditProfile,
  handleDeleteAccount,
  handleSetPassword,
  handleChangePassword,
  handleUserLinks,
} from "../controllers/auth.controller.js";
import { avatarUpload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/:userId/links", handleUserLinks);

router.route("/profile").get(handleProfilePage);

router
  .route("/edit-profile")
  .get(handleEditProfilePage)
  .post(avatarUpload.single("avatar"), handleEditProfile);

router
  .route("/set-password")
  .get(handleSetPasswordPage)
  .post(handleSetPassword);

router
  .route("/change-password")
  .get(handleChangePasswordPage)
  .post(handleChangePassword);

router.route("/delete-account").post(handleDeleteAccount);

export const userRoutes = router;
