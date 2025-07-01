import * as services from "../services/index.services.js";
import * as utils from "../utils/index.utils.js";

export const handleEditProfile = async (req, res) => {
  const { user, body, file } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to edit profile");
    return res.redirect("/auth/login");
  }

  const newName = body.name;
  const oldName = user.name;

  if (oldName === newName && !file) {
    req.flash("errors", "Nothing to edit in profile");
    res.redirect("/user/edit-profile");
  }

  let avatar = "";
  if (req.file) {
    const response = await utils.uploadOnCloudinary(req.file.path);

    if (!response) {
      req.flash("errors", "Failed to upload avatar image. Try again");
      res.redirect("/user/edit-profile");
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
      .redirect("/user/profile");
  } else {
    req.flash("errors", "Failed to edit profile. Try again");
    res.redirect("/user/edit-profile");
  }
};

export const handleDeleteAccount = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to delete this account");
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);

  const deletedUser = await services.deleteUser(user.id);
  const deletedLinks = await services.deleteUserLinks(user.id);
  const deletedOAuthUser = await services.deleteOAuthUser(loggedUser.oauthUser);

  if (deletedUser && deletedLinks && deletedOAuthUser) {
    req.flash("successes", "User account deleted successfully");
    return res
      .clearCookie("access_token")
      .clearCookie("refresh_token")
      .redirect("/");
  } else {
    req.flash("errors", "Failed to delete user account");
    return res.redirect("/user/profile");
  }
};

export const handleSetPassword = async (req, res) => {
  const { user, body } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to set password");
    return res.redirect("/auth/login");
  }

  const { password } = body;

  if (!password) {
    req.flash("errors", "Password is required");
    return res.redirect("/user/set-password");
  }

  if (password.length < 8) {
    req.flash("errors", "New password must be at least 8 characters long");
    return res.redirect("/user/set-password");
  }

  if (!password.match(/\d/)) {
    req.flash("errors", "New password must contain a number");
    return res.redirect("/user/set-password");
  }

  if (!password.match(/[a-z]/)) {
    req.flash("errors", "New password must include a lowercase letter");
    return res.redirect("/user/set-password");
  }

  if (!password.match(/[A-Z]/)) {
    req.flash("errors", "New password must include an uppercase letter");
    return res.redirect("/user/set-password");
  }

  if (!password.match(/[^\w\s]/)) {
    req.flash("errors", "New password must include a special character");
    return res.redirect("/user/set-password");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    if (loggedUser.password) {
      req.flash(
        "errors",
        "You already have your password, Instead change your password"
      );
      return res.redirect("/user/profile");
    }

    const hashedPassword = await services.hashPassword(password);
    if (hashedPassword) {
      const updatedUser = await services.updatePassword(
        loggedUser._id,
        hashedPassword
      );
      if (updatedUser) {
        req.flash("successes", "Password set successfully");
        return res.redirect("/user/profile");
      } else {
        req.flash("errors", "Failed to set password");
        return res.redirect("/user/set-password");
      }
    }
  } else {
    req.flash("errors", "Failed to set password");
    return res.redirect("/user/set-password");
  }
};

export const handleChangePassword = async (req, res) => {
  const { user, body } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to change password");
    return res.redirect("/auth/login");
  }

  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    req.flash("errors", "All fields are required");
    return res.redirect("/user/change-password");
  }

  if (oldPassword === newPassword) {
    req.flash("errors", "New password must be different from current password");
    return res.redirect("/user/change-password");
  }

  if (newPassword.length < 8) {
    req.flash("errors", "New password must be at least 8 characters long");
    return res.redirect("/user/change-password");
  }

  if (!newPassword.match(/\d/)) {
    req.flash("errors", "New password must contain a number");
    return res.redirect("/user/change-password");
  }

  if (!newPassword.match(/[a-z]/)) {
    req.flash("errors", "New password must include a lowercase letter");
    return res.redirect("/user/change-password");
  }

  if (!newPassword.match(/[A-Z]/)) {
    req.flash("errors", "New password must include an uppercase letter");
    return res.redirect("/user/change-password");
  }

  if (!newPassword.match(/[^\w\s]/)) {
    req.flash("errors", "New password must include a special character");
    return res.redirect("/user/change-password");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    const isPasswordValid = await services.isPasswordCorrect(
      oldPassword,
      loggedUser.password
    );

    if (!isPasswordValid) {
      req.flash("errors", "Current password you entered is invalid");
      return res.redirect("/user/change-password");
    }

    const hashedPassword = await hashPassword(newPassword);

    if (hashedPassword) {
      const updatedUser = await services.updatePassword(
        loggedUser._id,
        hashedPassword
      );
      if (updatedUser) {
        req.flash("successes", "Password changed successfully");
        return res.redirect("/user/profile");
      } else {
        req.flash("errors", "Failed to change password");
        return res.redirect("/user/change-password");
      }
    }
  } else {
    req.flash("errors", "Failed to change password");
    return res.redirect("/user/change-password");
  }
};
