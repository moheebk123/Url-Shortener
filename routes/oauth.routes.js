import { Router } from "express";

import * as oauth from "../controllers/index.controller.js";

const router = Router();

router.route("/oauth/:provider").get(oauth.handleOAuthRedirect);

router
  .route("/oauth-redirect/:provider/callback")
  .get(oauth.handleOAuthCallback);

export const oauthRoutes = router;
