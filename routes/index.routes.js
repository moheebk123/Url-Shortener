import { Router } from "express";

import { urlRoutes } from "./url.routes.js";
import { authRoutes } from "./auth.routes.js";
import { oauthRoutes } from "./oauth.routes.js";
import { userRoutes } from "./user.routes.js";

import {
  handleRoot,
  handleAbout,
  handleAllLinks,
} from "../controllers/urlShortener.controller.js";

const router = Router();

router.get("/", handleRoot);

router.get("/about", handleAbout);

router.get("/links", handleAllLinks);

const generalRoutes = router;

export { generalRoutes, urlRoutes, userRoutes, authRoutes, oauthRoutes };
