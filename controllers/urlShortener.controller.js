import path from "path";
import crypto from "crypto";
// import { readFile } from "fs/promises";
import { loadLinks, saveLinks } from "../models/links.model.js";

const viewFolderPath = path.join(path.dirname(import.meta.dirname), "views");

export const handleRoot = async (req, res) => {
  try {
    // const file = await readFile(path.join(viewFolderPath, "index.html"), "utf-8");
    const links = await loadLinks();

    // const content = file.replaceAll(
    //   "{{shortened_urls}}",
    //   Object.entries(links)
    //     .map(([shortCode, url]) => {
    //       const truncatedUrl =
    //         url.length >= 30 ? `${url.slice(0, 30)}...` : url;
    //       return `<div class="shorten-url">
    //       <a href="/${shortCode}" target="_blank" rel="noopener noreferrer">${req.host}/${shortCode}</a>
    //       <br/>
    //       <div>${truncatedUrl}</div>
    //     </div>`;
    //     })
    //     .join("")
    // );
    // return res.send(content);
    res.render("index", {links, host: req.host})
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("<h1>Internal Server Error</h1><a href='/'>Go to Home</a>");
  }
}

export const addShortenedUrl = async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
    const links = await loadLinks();

    if (links[finalShortCode]) {
      return res
        .status(400)
        .send(
          "<h1>Short code already exist. Please choose another.</h1><a href='/'>Go to Home</a>"
        );
    }

    links[finalShortCode] = url;
    await saveLinks(links);
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
    const links = await loadLinks();

    if (!links[shortCode])
      return res
        .status(404)
        .sendFile(path.join(viewFolderPath, "error.html"));

    return res.redirect(links[shortCode]);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send("<h1>Internal Server Error</h1><a href='/'>Go to Home</a>");
  }
};