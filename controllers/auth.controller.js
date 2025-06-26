import {
  createUser,
  generateToken,
  getUser,
  getUserWithLinks,
  hashPassword,
  isPasswordCorrect,
} from "../models/users.model.js";
import {loginUserSchema, registerUserSchema} from "../config/auth.config.js"

const handleRegister = async (req, res) => {
  try {
    const { data, error } = registerUserSchema.safeParse(req.body)
    if (error) {
      const errors = error.errors[0].message;
      req.flash("errors", errors);
      return res.redirect("/register")
    }

    const { name, email, password } = data;
    if ((!name || !email, !password)) {
      req.flash("errors", "All fields are required.");
      return res.redirect("/register");
    }

    const existedUser = await getUser(email);
    if (existedUser) {
      req.flash("errors", "User with this credentials already exist.");
      return res.redirect("/register");
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser({ name, email, password: hashedPassword });
    if (user) {
      req.flash("successes", "User registered successfully.");
      return res.redirect("/login");
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

    const existedUser = await getUser(email);
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

    const token = generateToken({
      id: existedUser.id,
      name: existedUser.name,
      email: existedUser.email,
    });

    req.flash("successes", "User login successfully.");
    return res
      .cookie("access_token", token)
      .redirect("/profile")
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
    return res.redirect("/")
  }

  req.flash("successes", "User logout successfully.");
  return res.clearCookie("access_token").redirect("/");
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

  const userProfile = await getUserWithLinks(user.id)
  if (userProfile) {
    return res.render("profile", {
      name: req.user.name,
      email: req.user.email,
      host: req.host,
      links: userProfile.shortenedUrls,
      successes: req.flash("successes"),
      errors: req.flash("errors"),
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
