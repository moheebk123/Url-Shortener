import { Router } from "express";

import { urlRoutes } from "./url.routes.js";
import { authRoutes } from "./auth.routes.js";
import { oauthRoutes } from "./oauth.routes.js";
import { userRoutes } from "./user.routes.js";

import * as pagesController from "../controllers/index.controller.js";

const router = Router();

router.get("/", pagesController.handleRoot);

router.get("/about", pagesController.handleAbout);

router.get("/links", pagesController.handleAllLinks);

const generalRoutes = router;

export { generalRoutes, urlRoutes, userRoutes, authRoutes, oauthRoutes };
