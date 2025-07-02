import * as services from "../services/index.services.js";

export const handleUserLinks = async (req, res) => {
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

    return res.render("user/userLinks", {
      successes: req.flash("successes"),
      errors: req.flash("errors"),
      host: req.host,
      links,
      totalPages,
      startPage,
      endPage,
      currentPage: page,
      userLinksPage: true,
      linksPage: true,
      homePage: false,
    });
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect(`/user/${req.user.id}/links?page=1`);
  }
};

export const handleProfilePage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash("errors", "You are not authenticated to access profile page");
    return res.redirect("/auth/login");
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

    return res.render("user/profile", {
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

export const handleEditProfilePage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access verify email page"
    );
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);
  if (loggedUser) {
    const { avatar } = loggedUser;
    return res.render("user/editProfile", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
      avatar,
    });
  }
};

export const handleSetPasswordPage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access set password page"
    );
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    return res.render("user/setPassword", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
    });
  }
};

export const handleChangePasswordPage = async (req, res) => {
  const { user } = req;
  if (!user) {
    req.flash(
      "errors",
      "You are not authenticated to access change password page"
    );
    return res.redirect("/auth/login");
  }

  const loggedUser = await services.getUserById(user.id);

  if (loggedUser) {
    return res.render("user/changePassword", {
      errors: req.flash("errors"),
      successes: req.flash("successes"),
    });
  }
};
