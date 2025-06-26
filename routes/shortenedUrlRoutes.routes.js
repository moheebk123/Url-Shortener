import { Router } from "express";
import { addShortenedUrl, handleRoot, redirectToUrl } from "../controllers/urlShortener.controller.js";

const router = Router();

router.get("/", handleRoot);

router.post("/", addShortenedUrl);

router.get("/:shortCode", redirectToUrl);

export const shortenedUrlRoutes = router;
