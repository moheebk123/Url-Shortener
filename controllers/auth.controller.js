import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { loginUserSchema, registerUserSchema } from "../config/auth.config.js";
import * as services from "../services/index.services.js";
import * as utils from "../utils/index.utils.js";

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

    const existedUser = await services.getUserByEmail(email);
    if (existedUser) {
      req.flash("errors", "User with this credentials already exist.");
      return res.redirect("/register");
    }

    const oauthUser = await services.createOAuthUser({ provider: "internal" });

    const hashedPassword = await services.hashPassword(password);

    const user = await createUser({
      name,
      email,
      password: hashedPassword,
      refreshToken: "",
      resetPasswordToken: "",
      isVerified: false,
      verificationCode: "",
      oauthUser: oauthUser._id,
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
          sameSite: "lax",
          secure: true, // true in production
          maxAge: 15 * 60 * 1000, // 1 min
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true, // true in production
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .redirect("/verify-email");
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

    const existedUser = await services.getUserByEmail(email);
    if (!existedUser) {
      req.flash("errors", "User doesn't exist.");
      return res.redirect("/login");
    }

    if (!existedUser.password) {
      req.flash(
        "errors",
        "You have created account using social login. Please login with your social account."
      );
      return res.redirect("/login");
    }

    const isPasswordValid = await services.isPasswordCorrect(
      password,
      existedUser.password
    );
    if (!isPasswordValid) {
      req.flash("errors", "Invalid user credentials.");
      return res.redirect("/login");
    }

    await services.linkOAuthUser(existedUser.oauthUser, {
      provider: "internal",
      providerAccountId: "internal",
    });

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
        sameSite: "lax",
        secure: true, // true in production
        maxAge: 15 * 60 * 1000, // 1 min
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: true, // true in production
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

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser) {
    await services.updateRefreshToken(loggedUser._id);

    req.flash("successes", "User logout successfully.");
    return res
      .clearCookie("access_token")
      .clearCookie("refresh_token")
      .redirect("/");
  }
};

const handleResendVerificationLink = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access resend verify email page"
    );
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser && loggedUser.isVerified) {
    req.flash("errors", "You have already been verified your email");
    return res.redirect("/profile");
  }

  const verificationCode = services.generateVerifyCode();
  await services.updateVerification(loggedUser._id, verificationCode);
  req.flash("successes", "Verification code sent successfully");
  return res.redirect("/verify-email");
};

const handleVerifyEmail = async (req, res) => {
  const { user, body } = req;

  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access resend verify email page"
    );
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser && loggedUser.isVerified) {
    req.flash("errors", "You have already been verified your email");
    return res.redirect("/profile");
  }

  const verificationCode = body.verifyCode;
  if (verificationCode === loggedUser.verificationCode) {
    await services.updateVerification(loggedUser._id, "", true);

    req.flash("successes", "Email verified successfully");
    return res.redirect("/profile");
  }
  req.flash("errors", "Invalid verification code");
  res.redirect("/verify-email");
};

const handleEditProfile = async (req, res) => {
  const { user, body, file } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to edit profile");
    return res.redirect("/login");
  }

  const newName = body.name;
  const oldName = user.name;

  if (oldName === newName && !file) {
    req.flash("errors", "Nothing to edit in profile");
    res.redirect("/edit-profile");
  }

  let avatar = "";
  if (req.file) {
    const response = await utils.uploadOnCloudinary(req.file.path);

    if (!response) {
      req.flash("errors", "Failed to upload avatar image. Try again");
      res.redirect("/edit-profile");
    }

    avatar = response.url;
  }

  const updatedUser = await services.updateUserProfile(
    user.id,
    newName,
    avatar
  );
  if (updatedUser) {
    const accessToken = services.generateToken(
      {
        id: user.id,
        name: newName,
        email: user.email,
      },
      process.env.JWT_SECRET,
      "1m"
    );

    req.flash("successes", "Profile edit successfully");
    return res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: true, // true in production
        maxAge: 15 * 60 * 1000, // 1 min
      })
      .redirect("/profile");
  } else {
    req.flash("errors", "Failed to edit profile. Try again");
    res.redirect("/edit-profile");
  }
};

const handleDeleteAccount = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to delete this account");
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);

  const deletedUser = await services.deleteUser(user.id);
  const deletedLinks = await services.deleteUserLinks(user.id);
  const deletedOAuthUser = await services.deleteOAuthUser(loggedUser.oauthUser);

  if (deletedUser && deletedLinks && deletedOAuthUser) {
    req.flash("successes", "User account deleted successfully");
    res.clearCookie("access_token").clearCookie("refresh_token").redirect("/");
  } else {
    req.flash("errors", "Failed to delete user account");
    res.redirect("/profile");
  }
};

const handleSetPassword = async (req, res) => {
  const { user, body } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to set password");
    return res.redirect("/login");
  }

  const { password } = body;

  if (!password) {
    req.flash("errors", "Password is required");
    return res.redirect("/set-password");
  }

  if (password.length < 8) {
    req.flash("errors", "New password must be at least 8 characters long");
    return res.redirect("/set-password");
  }

  if (!password.match(/\d/)) {
    req.flash("errors", "New password must contain a number");
    return res.redirect("/set-password");
  }

  if (!password.match(/[a-z]/)) {
    req.flash("errors", "New password must include a lowercase letter");
    return res.redirect("/set-password");
  }

  if (!password.match(/[A-Z]/)) {
    req.flash("errors", "New password must include an uppercase letter");
    return res.redirect("/set-password");
  }

  if (!password.match(/[^\w\s]/)) {
    req.flash("errors", "New password must include a special character");
    return res.redirect("/set-password");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    if (loggedUser.password) {
      req.flash(
        "errors",
        "You already have your password, Instead change your password"
      );
      return res.redirect("/profile");
    }

    const hashedPassword = await services.hashPassword(password);
    if (hashedPassword) {
      const updatedUser = await services.updatePassword(
        loggedUser._id,
        hashedPassword
      );
      if (updatedUser) {
        req.flash("successes", "Password set successfully");
        return res.redirect("/profile");
      } else {
        req.flash("errors", "Failed to set password");
        return res.redirect("/set-password");
      }
    }
  } else {
    req.flash("errors", "Failed to set password");
    return res.redirect("/set-password");
  }
};

const handleChangePassword = async (req, res) => {
  const { user, body } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to change password");
    return res.redirect("/login");
  }

  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    req.flash("errors", "All fields are required");
    return res.redirect("/change-password");
  }

  if (oldPassword === newPassword) {
    req.flash("errors", "New password must be different from current password");
    return res.redirect("/change-password");
  }

  if (newPassword.length < 8) {
    req.flash("errors", "New password must be at least 8 characters long");
    return res.redirect("/change-password");
  }

  if (!newPassword.match(/\d/)) {
    req.flash("errors", "New password must contain a number");
    return res.redirect("/change-password");
  }

  if (!newPassword.match(/[a-z]/)) {
    req.flash("errors", "New password must include a lowercase letter");
    return res.redirect("/change-password");
  }

  if (!newPassword.match(/[A-Z]/)) {
    req.flash("errors", "New password must include an uppercase letter");
    return res.redirect("/change-password");
  }

  if (!newPassword.match(/[^\w\s]/)) {
    req.flash("errors", "New password must include a special character");
    return res.redirect("/change-password");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    const isPasswordValid = await services.isPasswordCorrect(
      oldPassword,
      loggedUser.password
    );

    if (!isPasswordValid) {
      req.flash("errors", "Current password you entered is invalid");
      return res.redirect("/change-password");
    }

    const hashedPassword = await hashPassword(newPassword);

    if (hashedPassword) {
      const updatedUser = await services.updatePassword(
        loggedUser._id,
        hashedPassword
      );
      if (updatedUser) {
        req.flash("successes", "Password changed successfully");
        return res.redirect("/profile");
      } else {
        req.flash("errors", "Failed to change password");
        return res.redirect("/change-password");
      }
    }
  } else {
    req.flash("errors", "Failed to change password");
    return res.redirect("/change-password");
  }
};

const handleResetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || email.length === 0) {
    req.flash("errors", "Email is required to send reset password mail.");
    return res.redirect("/reset-password");
  }

  try {
    const existedUser = await services.getUserByEmail(email);
    if (existedUser) {
      const resetPasswordToken = services.generateToken(
        {
          email: existedUser.email,
        },
        process.env.JWT_SECRET,
        "1h"
      );

      existedUser.resetPasswordToken = resetPasswordToken;
      existedUser.save({ validateBeforeSave: false });

      try {
        const resetPasswordLink = `http://${req.host}/forget-password/${resetPasswordToken}`;
        const success = await services.sendResetPassword(
          existedUser.email,
          resetPasswordLink
        );

        if (success) {
          req.flash("successes", "Reset password link send to your email");
        } else {
          req.flash("errors", "Failed to send reset password link. Try Again.");
        }
        return res.redirect("/reset-password");
      } catch (error) {
        console.log(error);

        req.flash("errors", "Failed to send reset password link. Try Again.");
        return res.redirect("/reset-password");
      }
    } else {
      req.flash("errors", "Please enter a registered email");
    }
    return res.redirect("/reset-password");
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal server error.");
    return res.redirect("/reset-password");
  }
};

const handleForgetPassword = async (req, res) => {
  try {
    const { body, params } = req;
    const { resetPasswordToken } = params;

    const loggedUser = await services.getUserByResetPasswordToken(
      resetPasswordToken
    );

    if (loggedUser) {
      try {
        const decodedToken = services.verifyToken(resetPasswordToken);

        if (decodedToken && decodedToken.email === loggedUser.email) {
          const { repeatPassword, newPassword } = body;

          if (!repeatPassword || !newPassword) {
            req.flash("errors", "All fields are required");
            return res.redirect(req.url);
          }

          if (repeatPassword !== newPassword) {
            req.flash(
              "errors",
              "New password must be similar to Repeat password"
            );
            return res.redirect(req.url);
          }

          if (newPassword.length < 8) {
            req.flash(
              "errors",
              "New password must be at least 8 characters long"
            );
            return res.redirect(req.url);
          }

          if (!newPassword.match(/\d/)) {
            req.flash("errors", "New password must contain a number");
            return res.redirect(req.url);
          }

          if (!newPassword.match(/[a-z]/)) {
            req.flash("errors", "New password must include a lowercase letter");
            return res.redirect(req.url);
          }

          if (!newPassword.match(/[A-Z]/)) {
            req.flash(
              "errors",
              "New password must include an uppercase letter"
            );
            return res.redirect(req.url);
          }

          if (!newPassword.match(/[^\w\s]/)) {
            req.flash(
              "errors",
              "New password must include a special character"
            );
            return res.redirect(req.url);
          }
          const hashedPassword = await services.hashPassword(newPassword);

          if (hashedPassword) {
            const updatedUser = await services.updatePassword(
              loggedUser._id,
              hashedPassword
            );
            if (updatedUser) {
              loggedUser.resetPasswordToken = "";
              loggedUser.save({ validateBeforeSave: false });
              req.flash("successes", "Password reset successfully");
              return res.redirect("/login");
            } else {
              req.flash("errors", "Failed to reset password");
              return res.redirect(req.url);
            }
          }
        } else {
          req.flash("errors", "Reset password link expired. Generate again.");
          return res.redirect("/reset-password");
        }
      } catch (error) {
        console.log(error);
        req.flash("errors", "Reset password link expired. Generate again.");
        return res.redirect("/reset-password");
      }
    } else {
      req.flash("errors", "Invalid reset password link. Generate again.");
      return res.redirect("/reset-password");
    }
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal server error");
    return res.redirect(req.url);
  }
};

const handleUserLinks = async (req, res) => {
  const { userId } = req.params;
  const page = Number(req.query.page);

  if (userId !== req.user.id) {
    return res.render("error", { message: "Page Not Found" });
  }

  if (!page || page <= 0) {
    return res.redirect(`/user/${req.user.id}/links?page=1`);
  }

  try {
    const { links, totalLinks } = await services.loadLinks({
      limit: 10,
      skip: (page - 1) * 10,
      createdBy: req.user.id,
    });

    const totalPages = Math.ceil(totalLinks / 10);
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    if (totalLinks > 0 && page > totalPages) {
      return res.redirect(`/user/${req.user.id}/links?page=1`);
    }

    return res.render("userLinks", {
      successes: req.flash("successes"),
      errors: req.flash("errors"),
      host: req.host,
      links,
      totalPages,
      startPage,
      endPage,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect(`/user/${req.user.id}/links?page=1`);
  }
};

const handleRegisterPage = (req, res) => {
  const { user } = req;
  if (user) {
    req.flash("errors", "You can't access register page, if logged in");
    return res.redirect("/");
  }

  return res.render("register", { errors: req.flash("errors") });
};

const handleLoginPage = (req, res) => {
  const { user } = req;
  if (user) {
    req.flash("errors", "You can't access login page, if logged in");
    return res.redirect("/");
  }

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

  const userWithOAuthProvider = await services.getUserWithOAuthProvider(
    user.email
  );

  if (userWithOAuthProvider) {
    const date = new Date(userWithOAuthProvider.createdAt);
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;

    const {
      isVerified,
      password,
      oauthAvatar,
      avatar: localAvatar,
      oauthUser,
      shortenedUrls,
    } = userWithOAuthProvider;

    const avatar =
      oauthUser.provider !== "internal" && Boolean(oauthAvatar)
        ? oauthAvatar
        : Boolean(localAvatar)
        ? localAvatar
        : null;

    return res.render("profile", {
      successes: req.flash("successes"),
      errors: req.flash("errors"),
      host: req.host,
      linksLength: shortenedUrls.length,
      isVerified,
      since: formattedDate,
      isPasswordPresent: Boolean(password),
      avatar,
    });
  }
};

const handleVerifyEmailPage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access verify email page"
    );
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser && loggedUser.isVerified) {
    req.flash("errors", "You have already been verified your email");
    return res.redirect("/profile");
  }

  if (loggedUser && loggedUser.verificationCode.length === 0) {
    try {
      const verificationCode = services.generateVerifyCode();
      await services.updateVerification(loggedUser._id, verificationCode);

      const success = await services.sendVerificationCode(
        loggedUser.email,
        verificationCode
      );

      if (success) {
        req.flash("successes", "Verification code sent successfully");
        return res.render("verifyEmail", {
          errors: req.flash("errors"),
          successes: req.flash("successes"),
        });
      } else {
        req.flash(
          "errors",
          "Failed to send verification code. Click resend button"
        );
        return res.render("verifyEmail", {
          errors: req.flash("errors"),
          successes: req.flash("successes"),
        });
      }
    } catch (error) {
      console.log(error);

      req.flash(
        "errors",
        "Failed to send verification code. Click resend button"
      );
      return res.render("verifyEmail", {
        errors: req.flash("errors"),
        successes: req.flash("success"),
      });
    }
  }

  return res.render("verifyEmail", {
    errors: req.flash("errors"),
    successes: req.flash("successes"),
  });
};

const handleEditProfilePage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access verify email page"
    );
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser) {
    const { avatar } = loggedUser;
    return res.render("editProfile", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
      avatar,
    });
  }
};

const handleSetPasswordPage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access set password page"
    );
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    return res.render("setPassword", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
    });
  }
};

const handleChangePasswordPage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access change password page"
    );
    return res.redirect("/login");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    return res.render("changePassword", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
    });
  }
};

const handleResetPasswordPage = (req, res) => {
  return res.render("resetPassword", {
    errors: req.flash("errors"),
    successes: req.flash("successes"),
  });
};

const handleForgetPasswordPage = async (req, res) => {
  const { params } = req;

  const loggedUser = await services.getUserByResetPasswordToken(
    params.resetPasswordToken
  );

  if (loggedUser) {
    return res.render("forgetPassword", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
      resetPasswordUrl: req.url,
    });
  } else {
    req.flash("errors", "Invalid reset password link. Generate again.");
    return res.redirect("/reset-password");
  }
};

const handleOAuthRedirect = async (req, res) => {
  if (req.user) {
    req.flash("errors", "You have already logged in");
    return res.redirect("/");
  }
  try {
    const { provider } = req.params;
    const state = generateState();
    const codeVerifier = provider === "google" ? generateCodeVerifier() : null;
    const cookieConfig = {
      httpOnly: true,
      secure: true,
      maxAge: 10 * 60 * 1000,
      sameSite: "lax",
    };

    let url;
    if (provider === "google") {
      url = utils.google.createAuthorizationURL(state, codeVerifier, [
        "openid",
        "profile",
        "email",
      ]);

      return res
        .cookie("google_oauth_state", state, cookieConfig)
        .cookie("google_code_verifier", codeVerifier, cookieConfig)
        .redirect(url.toString());
    } else if (provider === "github") {
      url = utils.github.createAuthorizationURL(state, ["user:email"]);

      return res
        .cookie("github_oauth_state", state, cookieConfig)
        .redirect(url.toString());
    } else {
      return res.render("error", { message: "Social Login Not Found" });
    }
  } catch (error) {
    console.log(error);
    req.flash(
      "errors",
      "Failed to redirect social login page. Please try again!"
    );
    return res.redirect("/login");
  }
};

const handleOAuthCallback = async (req, res) => {
  const { params, query, cookies } = req;
  const { code, state } = query;
  const { provider } = params;
  let storedState, codeVerifier;

  if (provider === "google") {
    storedState = cookies.google_oauth_state;
    codeVerifier = cookies.google_code_verifier;
  } else if (provider === "github") {
    storedState = cookies.github_oauth_state;
  }

  if (!code || !state || !storedState || state !== storedState) {
    if (provider === "github") {
      req.flash(
        "errors",
        "Couldn't login with Github because of invalid login attempt. Please try again!"
      );
      res.redirect("/login");
    }
    if (provider === "google" || !codeVerifier) {
      req.flash(
        "errors",
        "Couldn't login with Google because of invalid login attempt. Please try again!"
      );
      res.redirect("/login");
    }
  }

  let tokens;
  try {
    let socialAccount = {};

    if (provider === "google") {
      tokens = await utils.google.validateAuthorizationCode(code, codeVerifier);
      const claims = decodeIdToken(tokens.idToken());
      const {
        sub: userId,
        name,
        email,
        email_verified: isVerified,
        picture: avatar,
      } = claims;
      socialAccount = {
        userId,
        name,
        email,
        isVerified,
        avatar,
      };
    } else if (provider === "github") {
      tokens = await utils.github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      });

      if (!githubUserResponse.ok) throw new Error();
      const githubUser = await githubUserResponse.json();
      const { id: userId, name, avatar_url: avatar } = githubUser;

      const githubEmailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
          },
        }
      );

      if (!githubEmailResponse.ok) throw new Error();
      const emails = await githubEmailResponse.json();
      const primaryEmail = emails.filter((e) => e.primary)[0];
      if (!primaryEmail) throw new Error();

      socialAccount = {
        userId,
        name,
        email: primaryEmail.email,
        isVerified: primaryEmail.verified,
        avatar,
      };
    }

    const user = await services.getUserWithOAuthProvider(socialAccount.email);

    if (user) {
      await services.linkOAuthUser(user.oauthUser._id, {
        provider,
        providerAccountId: socialAccount.userId,
      });

      const accessToken = services.generateToken(
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_SECRET,
        "1m"
      );

      const refreshToken = services.generateToken(
        {
          id: user._id,
        },
        process.env.JWT_REFRESH_SECRET,
        "7d"
      );

      user.refreshToken = refreshToken;
      user.isVerified = socialAccount.isVerified;
      user.oauthAvatar = socialAccount.avatar;
      user.save({ validateBeforeSave: false });

      req.flash(
        "successes",
        `${provider === "google" ? "Google" : "Github"} login successfully.`
      );
      return res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 15 * 60 * 1000, // 1 min
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .redirect("/profile");
    } else {
      const oauthUser = await services.createOAuthUser({
        provider,
        providerAccountId: socialAccount.userId,
      });

      const newUser = await services.createUser({
        name: socialAccount.name,
        email: socialAccount.email,
        oauthAvatar: socialAccount.avatar,
        refreshToken: "",
        resetPasswordToken: "",
        isVerified: socialAccount.isVerified,
        verificationCode: "",
        oauthUser: oauthUser._id,
      });

      const accessToken = services.generateToken(
        {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
        process.env.JWT_SECRET,
        "1m"
      );

      const refreshToken = services.generateToken(
        {
          id: newUser._id,
        },
        process.env.JWT_REFRESH_SECRET,
        "7d"
      );

      newUser.refreshToken = refreshToken;
      newUser.save({ validateBeforeSave: false });

      req.flash(
        "successes",
        `${provider === "google" ? "Google" : "Github"} login successfully.`
      );
      return res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 15 * 60 * 1000, // 1 min
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .redirect("/profile");
    }
  } catch (error) {
    console.log(error);

    req.flash(
      "errors",
      "Couldn't login through social account because of invalid login attempt. Please try again!"
    );
    res.redirect("/login");
  }
};

export {
  handleRegister,
  handleLogin,
  handleLogout,
  handleResendVerificationLink,
  handleVerifyEmail,
  handleEditProfile,
  handleDeleteAccount,
  handleSetPassword,
  handleChangePassword,
  handleResetPassword,
  handleForgetPassword,
  handleUserLinks,
  handleRegisterPage,
  handleLoginPage,
  handleProfilePage,
  handleVerifyEmailPage,
  handleEditProfilePage,
  handleSetPasswordPage,
  handleChangePasswordPage,
  handleResetPasswordPage,
  handleForgetPasswordPage,
  handleOAuthRedirect,
  handleOAuthCallback,
};
