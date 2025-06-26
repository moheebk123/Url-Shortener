import path from "path";
import crypto from "crypto";
import { addLink, loadLinks, getLink } from "../models/links.model.js";

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
    const { url, shortCode } = req.body;

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

    await addLink({ shortCode: finalShortCode, url });
    
    req.flash("successes", "Short code added successfully.");
    return res.redirect("/");
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
