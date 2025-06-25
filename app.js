import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import path from "path";
import crypto from "crypto"

const serveFile = async (res, fileName, contentType) => {
  try {
    const data = await readFile(path.join("public", fileName), "utf-8");
    res.writeHead(200, { "Content-Type": contentType });
    return res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/html" });
    return res.end("<h1>404 Page not Found</h1>");
  }
};

const loadLinks = async () => {
  try {
    const data = await readFile(path.join("data", "link.json"), "utf-8")
    return JSON.parse(data)
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(path.join("data", "link.json"), JSON.stringify({}), "utf-8");
      return {}
    }
    throw error;
  }
}

const saveLinks = async (links) => {
  await writeFile(path.join("data", "link.json"), JSON.stringify(links), "utf-8");
}

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    console.log(req.url)
    if (req.url === "/") {
      serveFile(res, "index.html", "text/html")
    } else if (req.url === "/style.css") {
      serveFile(res, "style.css", "text/css");
    } else if (req.url === "/index.js") {
      serveFile(res, "index.js", "text/js");
    } else if (req.url === "/links") {
    const links = await loadLinks();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(links));
    } else {
      const links = await loadLinks();
      const shortCode = req.url.slice(1)
      if (links[shortCode]) {
        res.writeHead(302, { location: links[shortCode] })
        return res.end()
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end("Shortened URL is not found.");
      }
    }
  }
  if (req.method === "POST" && req.url === "/shorten") {
    console.log("hello")
    const links = await loadLinks();

    let body = "";
    req.on("data", (chunk) => body += chunk)
    req.on("end", async () => {
      const data = JSON.parse(body)
      console.log(data)
      if (!data.url) {
        res.writeHead(400, { "Content-Type": "text/plain"})
        return res.end("URL is required")
      }

      const finalShortCode = data.customUrl || crypto.randomBytes(4).toString("hex")

      if (links[finalShortCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Short code already exist. Please choose another.");
      }

      links[finalShortCode] = data.url;
      await saveLinks(links)
      res.writeHead(200, {"Content-Type": "application/json"})
      res.end(JSON.stringify({success: true, shortCode: finalShortCode}))
    })
    req.on("error", (error) => console.log(error.message));
  }
});

const PORT = 3000;

server.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
