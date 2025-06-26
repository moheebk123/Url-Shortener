import crypto from "crypto";
import {
  addLink,
  loadLinks,
  getLink,
  getLinkById,
  updateLink,
  deleteLink,
} from "../services/links.services.js";
import { getUserById, pushShortenedUrl } from "../services/user.services.js";

export const handleRoot = async (req, res) => {
  try {
    let isVerified = false;
    const { links } = await loadLinks({ limit: 5 });
    const { user } = req;
    if (user) {
      const loggedUser = await getUserById(user.id);

      if (loggedUser && loggedUser.isVerified) {
        isVerified = true;
      }
    }

    return res.render("index", {
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
  return res.render("about");
};

export const handleAllLinks = async (req, res) => {
  const page = Number(req.query.page);
  if (!page || page <= 0) {
    return res.redirect("/links?page=1");
  }

  try {
    const { links, totalLinks } = await loadLinks({
      limit: 10,
      skip: (page - 1) * 10,
    });

    const totalPages = Math.ceil(totalLinks / 10);
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    if (page > totalPages) {
      return res.redirect("/links?page=1");
    }

    return res.render("links", {
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
      const link = await getLink(finalShortCode);

      if (link) {
        req.flash("errors", "Short code already exist.");
        return res.redirect("/");
      }

      const newShortUrl = await addLink({
        shortCode: finalShortCode,
        url,
        createdBy: user.id,
      });

      if (newShortUrl) {
        await pushShortenedUrl(user.id, newShortUrl._id);
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
    const link = await getLink(shortCode);

    if (!link) return res.render("error", { message: "Link Not Found" });

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
      return res.redirect("/profile");
    }

    const { id } = req.params;
    const shortenedUrl = await getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      return res.render("editUrlShortener", {
        shortenedUrl,
        errors: req.flash("errors"),
        successes: req.flash("successes"),
      });
    } else {
      req.flash(
        "errors",
        "You are not authenticated to edit this shortened url"
      );
      return res.redirect("/profile");
    }
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/profile");
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
    const shortenedUrl = await getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      const { url, shortCode } = req.body;

      if (!url) {
        req.flash("errors", "Url is required.");
        return res.redirect(req.url);
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      const updatedShortUrl = await updateLink(shortenedUrl._id, {
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
    const shortenedUrl = await getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      const deletedShortUrl = await deleteLink(shortenedUrl._id);
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
