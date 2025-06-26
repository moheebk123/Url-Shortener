import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleRegisterPage,
  handleLoginPage,
  handleProfilePage,
  handleLogout
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/register", handleRegisterPage);

router.post("/register", handleRegister);

router.route("/login").get(handleLoginPage).post(handleLogin)

router.route("/profile").get(handleProfilePage);

router.route("/logout").get(handleLogout);

export const authRoutes = router;
