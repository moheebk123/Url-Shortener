import * as services from "../services/index.services.js";

export const handleRegisterPage = (req, res) => {
  const { user } = req;
  if (user) {
    req.flash("errors", "You can't access register page, if logged in");
    return res.redirect("/");
  }

  return res.render("auth/register", { errors: req.flash("errors") });
};

export const handleLoginPage = (req, res) => {
  const { user } = req;
  if (user) {
    req.flash("errors", "You can't access login page, if logged in");
    return res.redirect("/");
  }

  return res.render("auth/login", {
    errors: req.flash("errors"),
    successes: req.flash("successes"),
  });
};

export const handleVerifyEmailPage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access verify email page"
    );
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser && loggedUser.isVerified) {
    req.flash("errors", "You have already been verified your email");
    return res.redirect("/user/profile");
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
        return res.render("auth/verifyEmail", {
          errors: req.flash("errors"),
          successes: req.flash("successes"),
        });
      } else {
        req.flash(
          "errors",
          "Failed to send verification code. Click resend button"
        );
        return res.render("auth/verifyEmail", {
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
      return res.render("auth/verifyEmail", {
        errors: req.flash("errors"),
        successes: req.flash("success"),
      });
    }
  }

  return res.render("auth/verifyEmail", {
    errors: req.flash("errors"),
    successes: req.flash("successes"),
  });
};

export const handleResetPasswordPage = (req, res) => {
  return res.render("auth/resetPassword", {
    errors: req.flash("errors"),
    successes: req.flash("successes"),
  });
};

export const handleForgetPasswordPage = async (req, res) => {
  const { params } = req;

  const loggedUser = await services.getUserByResetPasswordToken(
    params.resetPasswordToken
  );

  if (loggedUser) {
    return res.render("auth/forgetPassword", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
      resetPasswordUrl: req.url,
    });
  } else {
    req.flash("errors", "Invalid reset password link. Generate again.");
    return res.redirect("/auth/reset-password");
  }
};
