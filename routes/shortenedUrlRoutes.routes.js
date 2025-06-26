import { Router } from "express";
import {
  handleRoot,
  handleAbout,
  handleAllLinks,
  addShortenedUrl,
  redirectToUrl,
  handleDeleteUrlShortener,
  handleEditUrlShortener,
  handleEditUrlShortenerPage,
} from "../controllers/urlShortener.controller.js";

const router = Router();

router.get("/", handleRoot);

router.get("/about", handleAbout);

router.get("/links", handleAllLinks);

router.post("/", addShortenedUrl);

router.get("/shortUrl/:shortCode", redirectToUrl);

router
  .route("/edit-shortened-url/:id")
  .get(handleEditUrlShortenerPage)
  .post(handleEditUrlShortener);

router.post("/delete/:id", handleDeleteUrlShortener);

export const shortenedUrlRoutes = router;
