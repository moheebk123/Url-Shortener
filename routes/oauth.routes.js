import { Router } from "express";

import {
  handleOAuthRedirect,
  handleOAuthCallback,
} from "../controllers/auth.controller.js";

const router = Router();

router.route("/oauth/:provider").get(handleOAuthRedirect);

router.route("/oauth-redirect/:provider/callback").get(handleOAuthCallback);

export const oauthRoutes = router;
