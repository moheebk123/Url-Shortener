import crypto from "crypto";
import * as services from "../services/index.services.js";

export const handleRoot = async (req, res) => {
  try {
    let isVerified = false;
    const { links } = await services.loadLinks({ limit: 5 });
    const { user } = req;
    if (user) {
      const loggedUser = await services.getUserById(user.id);

      if (loggedUser && loggedUser.isVerified) {
        isVerified = true;
      }
    }

    return res.render("general/index", {
      links,
      host: req.host,
      errors: req.flash("errors"),
      successes: req.flash("successes"),
      isVerified,
    });
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/");
  }
};

export const handleAbout = (_, res) => {
  return res.render("general/about");
};

export const handleAllLinks = async (req, res) => {
  const page = Number(req.query.page);
  if (!page || page <= 0) {
    return res.redirect("/links?page=1");
  }

  try {
    const { links, totalLinks } = await services.loadLinks({
      limit: 10,
      skip: (page - 1) * 10,
    });

    const totalPages = Math.ceil(totalLinks / 10);
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    if (totalLinks > 0 && page > totalPages) {
      return res.redirect("/links?page=1");
    }

    return res.render("general/links", {
      links,
      host: req.host,
      totalPages,
      startPage,
      endPage,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/links?page=1");
  }
};

export const addShortenedUrl = async (req, res) => {
  try {
    const { user, body } = req;

    if (user) {
      const { url, shortCode } = body;

      if (!url) {
        req.flash("errors", "URL is required.");
        return res.redirect("/");
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
      const link = await services.getLink(finalShortCode);

      if (link) {
        req.flash("errors", "Short code already exist.");
        return res.redirect("/");
      }

      const newShortUrl = await services.addLink({
        shortCode: finalShortCode,
        url,
        createdBy: user.id,
      });

      if (newShortUrl) {
        await services.pushShortenedUrl(user.id, newShortUrl._id);
      }

      req.flash("successes", "Short code added successfully.");
      return res.redirect("/");
    }
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/");
  }
};

export const redirectToUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const link = await services.getLink(shortCode);

    if (!link) return res.render("general/error", { message: "Link Not Found" });

    link.redirectionCount = link.redirectionCount + 1;
    link.save({ validateBeforeSave: false });

    return res.status(301).redirect(link.url);
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/");
  }
};

export const handleEditUrlShortenerPage = async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      req.flash("errors", "You are not authenticated to access edit page");
      return res.redirect("/user/profile");
    }

    const { id } = req.params;
    const shortenedUrl = await services.getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      return res.render("user/editUrlShortener", {
        shortenedUrl,
        errors: req.flash("errors"),
        successes: req.flash("successes"),
      });
    } else {
      req.flash(
        "errors",
        "You are not authenticated to edit this shortened url"
      );
      return res.redirect("/user/profile");
    }
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/user/profile");
  }
};

export const handleEditUrlShortener = async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      req.flash("errors", "You are not authenticated to access edit page");
      return res.redirect(`/user/${user.id}/links?page=1`);
    }

    const { id } = req.params;
    const shortenedUrl = await services.getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      const { url, shortCode } = req.body;

      if (!url) {
        req.flash("errors", "Url is required.");
        return res.redirect(req.url);
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      const updatedShortUrl = await services.updateLink(shortenedUrl._id, {
        url,
        shortCode: finalShortCode,
      });

      if (updatedShortUrl) {
        req.flash("successes", "Shortened Url updated successfully");
        return res.redirect(`/user/${user.id}/links?page=1`);
      }
    } else {
      req.flash(
        "errors",
        "You are not authenticated to edit this shortened url"
      );
      return res.redirect(`/user/${user.id}/links?page=1`);
    }
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect(req.url);
  }
};

export const handleDeleteUrlShortener = async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      req.flash("errors", "You are not authenticated to delete shortened url");
      return res.redirect(`/user/${user.id}/links?page=1`);
    }

    const { id } = req.params;
    const shortenedUrl = await services.getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      const deletedShortUrl = await services.deleteLink(shortenedUrl._id);
      if (deletedShortUrl) {
        req.flash("successes", "Shortened Url deleted successfully");
        return res.redirect(`/user/${user.id}/links?page=1`);
      }
    } else {
      req.flash(
        "errors",
        "You are not authenticated to delete this shortened url"
      );
      return res.redirect(`/user/${user.id}/links?page=1`);
    }
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect(`/user/${user.id}/links?page=1`);
  }
};
