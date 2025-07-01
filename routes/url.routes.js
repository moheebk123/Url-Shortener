import { Router } from "express";

import * as urlControllers from "../controllers/index.controller.js";

const router = Router();

router.post("/add-url", urlControllers.addShortenedUrl);

router.get("/shortUrl/:shortCode", urlControllers.redirectToUrl);

router
  .route("/edit-shortened-url/:id")
  .get(urlControllers.handleEditUrlShortenerPage)
  .post(urlControllers.handleEditUrlShortener);

router.post(
  "/delete-shortened-url/:id",
  urlControllers.handleDeleteUrlShortener
);

export const urlRoutes = router;
