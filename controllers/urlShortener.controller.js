import path from "path";
import crypto from "crypto";
import { addLink, loadLinks, getLink } from "../models/links.model.js";

const viewFolderPath = path.join(path.dirname(import.meta.dirname), "views");

export const handleRoot = async (req, res) => {
  try {
    const links = await loadLinks();

    res.render("index", { links, host: req.host });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("<h1>Internal Server Error</h1><a href='/'>Go to Home</a>");
  }
};

export const addShortenedUrl = async (req, res) => {
  try {
    const { url, shortCode } = req.body;

    if (!url) {
      return res
        .status(400)
        .send("<h1>URL is required.</h1><a href='/'>Go to Home</a>");
    }

    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
    const link = await getLink(finalShortCode);

    if (link) {
      return res
        .status(400)
        .send(
          "<h1>Short code already exist. Please choose another.</h1><a href='/'>Go to Home</a>"
        );
    }

    await addLink({ shortCode: finalShortCode, url });
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("<h1>Internal Server Error</h1><a href='/'>Go to Home</a>");
  }
};

export const redirectToUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const link = await getLink(shortCode)

    if (!link)
      return res.status(404).sendFile(path.join(viewFolderPath, "error.html"));

    return res.redirect(link.url);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("<h1>Internal Server Error</h1><a href='/'>Go to Home</a>");
  }
};
