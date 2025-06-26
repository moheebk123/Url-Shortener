import { loginUserSchema, registerUserSchema } from "../config/auth.config.js";
import {
  getUserByEmail,
  createUser,
  getUserById,
  updateRefreshToken,
  getUserWithLinks,
} from "../services/user.services.js";
import {
  hashPassword,
  generateToken,
  isPasswordCorrect,
} from "../services/auth.services.js";

const handleRegister = async (req, res) => {
  try {
    const { data, error } = registerUserSchema.safeParse(req.body);
    if (error) {
      const errors = error.errors[0].message;
      req.flash("errors", errors);
      return res.redirect("/register");
    }

    const { name, email, password } = data;
    if ((!name || !email, !password)) {
      req.flash("errors", "All fields are required.");
      return res.redirect("/register");
    }

    const existedUser = await getUserByEmail(email);
    if (existedUser) {
      req.flash("errors", "User with this credentials already exist.");
      return res.redirect("/register");
    }

    const hashedPassword = await hashPassword(password);

    const user = await createUser({
      name,
      email,
      password: hashedPassword,
      refreshToken: "",
      isVerified: false,
    });
    if (user) {
      const accessToken = generateToken(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_SECRET,
        "1m"
      );

      const refreshToken = generateToken(
        {
          id: user.id,
        },
        process.env.JWT_REFRESH_SECRET,
        "7d"
      );

      user.refreshToken = refreshToken;
      user.save({ validateBeforeSave: false });

      req.flash("successes", "User registered successfully.");
      return res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          sameSite: "Strict",
          secure: false, // true in production
          maxAge: 15 * 60 * 1000, // 1 min
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "Strict",
          secure: false, // true in production
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .redirect("/profile");
    }
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal Server Error");
    return res.redirect("/register");
  }
};

const handleLogin = async (req, res) => {
  try {
    const { data, error } = loginUserSchema.safeParse(req.body);
    if (error) {
      const errors = error.errors[0].message;
      req.flash("errors", errors);
      return res.redirect("/login");
    }

    const { email, password } = data;
    if ((!email, !password)) {
      req.flash("errors", "All fields are required.");
      return res.redirect("/login");
    }

    const existedUser = await getUserByEmail(email);
    if (!existedUser) {
      req.flash("errors", "User doesn't exist.");
      return res.redirect("/login");
    }

    const isPasswordValid = await isPasswordCorrect(
      password,
      existedUser.password
    );
    if (!isPasswordValid) {
      req.flash("errors", "Invalid user credentials.");
      return res.redirect("/login");
    }

    const accessToken = generateToken(
      {
        id: existedUser.id,
        name: existedUser.name,
        email: existedUser.email,
      },
      process.env.JWT_SECRET,
      "1m"
    );

    const refreshToken = generateToken(
      {
        id: existedUser.id,
      },
      process.env.JWT_REFRESH_SECRET,
      "7d"
    );

    existedUser.refreshToken = refreshToken;
    existedUser.save({ validateBeforeSave: false });

    req.flash("successes", "User login successfully.");
    return res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "Strict",
        secure: false, // true in production
        maxAge: 15 * 60 * 1000, // 1 min
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "Strict",
        secure: false, // true in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .redirect("/profile");
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal Server Error");
    return res.redirect("/login");
  }
};

const handleLogout = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to logout");
    return res.redirect("/");
  }

  const loggedUser = await getUserById(user.id);
  if (loggedUser) {
    await updateRefreshToken(loggedUser._id);

    req.flash("successes", "User logout successfully.");
    return res
      .clearCookie("access_token")
      .clearCookie("refresh_token")
      .redirect("/");
  }
};

const handleRegisterPage = (req, res) => {
  return res.render("register", { errors: req.flash("errors") });
};

const handleLoginPage = (req, res) => {
  return res.render("login", {
    errors: req.flash("errors"),
    successes: req.flash("successes"),
  });
};

const handleProfilePage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to access profile page");
    return res.redirect("/login");
  }

  const userProfile = await getUserWithLinks(user.id);

  if (userProfile) {
    const date = new Date(userProfile.createdAt);
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;

    return res.render("profile", {
      host: req.host,
      links: userProfile.shortenedUrls,
      successes: req.flash("successes"),
      errors: req.flash("errors"),
      isVerified: userProfile.isVerified,
      since: formattedDate,
    });
  }
};

export {
  handleRegister,
  handleLogin,
  handleLogout,
  handleRegisterPage,
  handleLoginPage,
  handleProfilePage,
};
