import path from "path";
import crypto from "crypto";
import {
  addLink,
  loadLinks,
  getLink,
  getLinkById,
  updateLink,
  deleteLink,
} from "../services/links.services.js";
import { pushShortenedUrl } from "../services/user.services.js";

const viewFolderPath = path.join(path.dirname(import.meta.dirname), "views");

export const handleRoot = async (req, res) => {
  try {
    const links = await loadLinks();

    return res.render("index", {
      links,
      host: req.host,
      errors: req.flash("errors"),
      successes: req.flash("successes"),
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

    if (!link)
      return res.status(404).sendFile(path.join(viewFolderPath, "error.html"));

    return res.redirect(link.url);
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/");
  }
};

export const handleEditPage = async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      req.flash("errors", "You are not authenticated to access edit page");
      return res.redirect("/profile");
    }

    const { id } = req.params;
    const shortenedUrl = await getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      return res.render("edit", {
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

export const handleEdit = async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      req.flash("errors", "You are not authenticated to access edit page");
      return res.redirect("/profile");
    }

    const { id } = req.params;
    const shortenedUrl = await getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      const { url, shortCode } = req.body;

      if (!url) {
        req.flash(
          "errors",
          "Url is required."
        );
        return res.redirect(req.url);
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      const updatedShortUrl = await updateLink(shortenedUrl._id, {url, shortCode: finalShortCode})

      if (updatedShortUrl) {
        req.flash(
          "successes",
          "Shortened Url updated successfully"
        );
        return res.redirect("/profile");
      }
    } else {
      req.flash(
        "errors",
        "You are not authenticated to edit this shortened url"
      );
    }
  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect(req.url);
  }
};

export const handleDelete = async (req, res) => {
  try {
    const { user } = req;
    if (!user) {
      req.flash("errors", "You are not authenticated to access edit page");
      return res.redirect("/profile");
    }

    const { id } = req.params;
    const shortenedUrl = await getLinkById(id);

    if (shortenedUrl && user.id === shortenedUrl.createdBy.toString()) {
      const deletedShortUrl = await deleteLink(shortenedUrl._id);
      if (deletedShortUrl) {
        req.flash("successes", "Shortened Url deleted successfully");
        return res.redirect("/profile");
      }
    } else {
      req.flash(
        "errors",
        "You are not authenticated to delete this shortened url"
      );
    }

  } catch (error) {
    console.log(error);

    req.flash("errors", "Internal Server Error");
    return res.redirect("/profile");

  }
};
