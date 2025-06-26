import { Router } from "express";
import {
  handleRoot,
  handleAbout,
  addShortenedUrl,
  redirectToUrl,
} from "../controllers/urlShortener.controller.js";

const router = Router();

router.get("/", handleRoot);

router.get("/about", handleAbout);

router.post("/", addShortenedUrl);

router.get("/:shortCode", redirectToUrl);

export const shortenedUrlRoutes = router;
