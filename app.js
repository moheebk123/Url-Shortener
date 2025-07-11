import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import cors from "cors";
import { env } from "./config/env.config.js";
import { connectDB } from "./config/db-client.config.js";
import * as routes from "./routes/index.routes.js";
import { verifyAuthentication } from "./middlewares/verify.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

const staticPath = path.join(import.meta.dirname, "public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: false,
  })
);
app.use(flash());

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(verifyAuthentication);
app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});

app.use(routes.generalRoutes);
app.use(routes.urlRoutes);
app.use("/user", routes.userRoutes);
app.use("/auth", routes.authRoutes);
app.use(routes.oauthRoutes);

app.use((_, res) => {
  return res.render("general/error", { message: "Page Not Found" });
});

try {
  await connectDB();
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
  });
} catch (error) {
  console.error(error);
}
