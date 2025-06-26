import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import { env } from ".//config/env.config.js";
import { connectDB } from "./config/db-client.config.js";
import { shortenedUrlRoutes } from "./routes/shortenedUrlRoutes.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { verifyAuthentication } from "./middlewares/verify.middleware.js";

const app = express();

const staticPath = path.join(import.meta.dirname, "public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET || "moheebkhan",
    resave: true,
    saveUninitialized: false,
  })
);
app.use(flash());

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(verifyAuthentication);
app.use((req, res, next) => {
  console.log(req.user)
  res.locals.user = req.user;
  return next();
});

app.use(authRoutes);
app.use(shortenedUrlRoutes);

app.use((_, res) => {
  return res
    .status(404)
    .sendFile(path.join(import.meta.dirname, "views", "error.html"));
});

try {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
  });
} catch (error) {
  console.error(error);
}
