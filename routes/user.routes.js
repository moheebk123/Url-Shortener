import { Router } from "express";

import * as userControllers from "../controllers/index.controller.js";
import { avatarUpload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/:userId/links", userControllers.handleUserLinks);

router.route("/profile").get(userControllers.handleProfilePage);

router
  .route("/edit-profile")
  .get(userControllers.handleEditProfilePage)
  .post(avatarUpload.single("avatar"), userControllers.handleEditProfile);

router
  .route("/set-password")
  .get(userControllers.handleSetPasswordPage)
  .post(userControllers.handleSetPassword);

router
  .route("/change-password")
  .get(userControllers.handleChangePasswordPage)
  .post(userControllers.handleChangePassword);

router.route("/delete-account").post(userControllers.handleDeleteAccount);

export const userRoutes = router;
