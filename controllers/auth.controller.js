import { loginUserSchema, registerUserSchema } from "../config/auth.config.js";
import * as services from "../services/index.services.js";

export const handleRegister = async (req, res) => {
  try {
    const { data, error } = registerUserSchema.safeParse(req.body);
    if (error) {
      const errors = error.errors[0].message;
      req.flash("errors", errors);
      return res.redirect("/auth/register");
    }

    const { name, email, password } = data;
    if ((!name || !email, !password)) {
      req.flash("errors", "All fields are required.");
      return res.redirect("/auth/register");
    }

    const existedUser = await services.getUserByEmail(email);
    if (existedUser) {
      req.flash("errors", "User with this credentials already exist.");
      return res.redirect("/auth/register");
    }

    const oauthUser = await services.createOAuthUser({ provider: "internal" });

    const hashedPassword = await services.hashPassword(password);

    const user = await services.createUser({
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
      const accessToken = services.generateToken(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_SECRET,
        "1m"
      );

      const refreshToken = services.generateToken(
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
        .redirect("/auth/verify-email");
    }
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal Server Error");
    return res.redirect("/auth/register");
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { data, error } = loginUserSchema.safeParse(req.body);
    if (error) {
      const errors = error.errors[0].message;
      req.flash("errors", errors);
      return res.redirect("/auth/login");
    }

    const { email, password } = data;
    if ((!email, !password)) {
      req.flash("errors", "All fields are required.");
      return res.redirect("/auth/login");
    }

    const existedUser = await services.getUserByEmail(email);
    if (!existedUser) {
      req.flash("errors", "User doesn't exist.");
      return res.redirect("/auth/login");
    }

    if (!existedUser.password) {
      req.flash(
        "errors",
        "You have created account using social login. Please login with your social account."
      );
      return res.redirect("/auth/login");
    }

    const isPasswordValid = await services.isPasswordCorrect(
      password,
      existedUser.password
    );
    if (!isPasswordValid) {
      req.flash("errors", "Invalid user credentials.");
      return res.redirect("/auth/login");
    }

    await services.linkOAuthUser(existedUser.oauthUser, {
      provider: "internal",
      providerAccountId: "internal",
    });

    const accessToken = services.generateToken(
      {
        id: existedUser.id,
        name: existedUser.name,
        email: existedUser.email,
      },
      process.env.JWT_SECRET,
      "1m"
    );

    const refreshToken = services.generateToken(
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
      .redirect("/user/profile");
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal Server Error");
    return res.redirect("/auth/login");
  }
};

export const handleLogout = async (req, res) => {
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

export const handleResendVerificationLink = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access resend verify email page"
    );
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser && loggedUser.isVerified) {
    req.flash("errors", "You have already been verified your email");
    return res.redirect("/user/profile");
  }

  const verificationCode = services.generateVerifyCode();
  await services.updateVerification(loggedUser._id, verificationCode);
  req.flash("successes", "Verification code sent successfully");
  return res.redirect("/auth/verify-email");
};

export const handleVerifyEmail = async (req, res) => {
  const { user, body } = req;

  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access resend verify email page"
    );
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser && loggedUser.isVerified) {
    req.flash("errors", "You have already been verified your email");
    return res.redirect("/user/profile");
  }

  const verificationCode = body.verifyCode;
  if (verificationCode === loggedUser.verificationCode) {
    await services.updateVerification(loggedUser._id, "", true);

    req.flash("successes", "Email verified successfully");
    return res.redirect("/user/profile");
  }
  req.flash("errors", "Invalid verification code");
  res.redirect("/auth/verify-email");
};

export const handleResetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || email.length === 0) {
    req.flash("errors", "Email is required to send reset password mail.");
    return res.redirect("/auth/reset-password");
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
        const resetPasswordLink = `${
          req.host.includes("localhost") ? "http" : "https"
        }://${req.host}/auth/forget-password/${resetPasswordToken}`;
        const success = await services.sendResetPassword(
          existedUser.email,
          resetPasswordLink
        );

        if (success) {
          req.flash("successes", "Reset password link send to your email");
        } else {
          req.flash("errors", "Failed to send reset password link. Try Again.");
        }
        return res.redirect("/auth/reset-password");
      } catch (error) {
        console.log(error);

        req.flash("errors", "Failed to send reset password link. Try Again.");
        return res.redirect("/auth/reset-password");
      }
    } else {
      req.flash("errors", "Please enter a registered email");
    }
    return res.redirect("/auth/reset-password");
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal server error.");
    return res.redirect("/auth/reset-password");
  }
};

export const handleForgetPassword = async (req, res) => {
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
              return res.redirect("/auth/login");
            } else {
              req.flash("errors", "Failed to reset password");
              return res.redirect(req.url);
            }
          }
        } else {
          req.flash("errors", "Reset password link expired. Generate again.");
          return res.redirect("/auth/reset-password");
        }
      } catch (error) {
        console.log(error);
        req.flash("errors", "Reset password link expired. Generate again.");
        return res.redirect("/auth/reset-password");
      }
    } else {
      req.flash("errors", "Invalid reset password link. Generate again.");
      return res.redirect("/auth/reset-password");
    }
  } catch (error) {
    console.log(error);
    req.flash("errors", "Internal server error");
    return res.redirect(req.url);
  }
};
