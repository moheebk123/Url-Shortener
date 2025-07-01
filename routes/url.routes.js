import { Router } from "express";

import {
  addShortenedUrl,
  redirectToUrl,
  handleDeleteUrlShortener,
  handleEditUrlShortener,
  handleEditUrlShortenerPage,
} from "../controllers/urlShortener.controller.js";

const router = Router();

router.post("/", addShortenedUrl);

router.get("/shortUrl/:shortCode", redirectToUrl);

router
  .route("/edit-shortened-url/:id")
  .get(handleEditUrlShortenerPage)
  .post(handleEditUrlShortener);

router.post("/delete/:id", handleDeleteUrlShortener);

export const urlRoutes = router;
