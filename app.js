import express from "express";
import { env } from ".//config/env.config.js";
import path from "path";
import { shortenedUrlRoutes } from "./routes/shortenedUrlRoutes.routes.js";

const app = express();

const staticPath = path.join(import.meta.dirname, "public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(shortenedUrlRoutes)

app.use((req, res) => {
  return res.status(404).sendFile(path.join(import.meta.dirname, "views", "error.html"));
});

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
