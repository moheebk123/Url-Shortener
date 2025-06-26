import { Router } from "express";
import {
  handleRoot,
  handleAbout,
  addShortenedUrl,
  redirectToUrl,
  handleDelete,
  handleEdit,
  handleEditPage,
} from "../controllers/urlShortener.controller.js";

const router = Router();

router.get("/", handleRoot);

router.get("/about", handleAbout);

router.post("/", addShortenedUrl);

router.get("/:shortCode", redirectToUrl);

router.route("/edit/:id").get(handleEditPage).post(handleEdit);

router.post("/delete/:id", handleDelete);

export const shortenedUrlRoutes = router;
