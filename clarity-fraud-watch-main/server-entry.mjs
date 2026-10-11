import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import app from "./dist/server/server.js";

const PORT = Number(process.env.PORT || 3000);
const assetsDir = path.resolve("dist/client/assets");

const mimeTypes = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/assets/")) {
      const relativePath = decodeURIComponent(url.pathname.slice("/assets/".length));
      const filePath = path.resolve(assetsDir, relativePath);

      if (
        filePath.startsWith(assetsDir + path.sep) &&
        existsSync(filePath) &&
        statSync(filePath).isFile()
      ) {
        res.statusCode = 200;
        res.setHeader(
          "Content-Type",
          mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
        );
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

        if (req.method === "HEAD") {
          res.end();
          return;
        }

        await pipeline(createReadStream(filePath), res);
        return;
      }

      res.writeHead(404);
      res.end("Asset not found");
      return;
    }

    const requestUrl = `http://${req.headers.host || "localhost"}${req.url || "/"}`;
    const hasBody = !["GET", "HEAD"].includes(req.method || "GET");

    const request = new Request(requestUrl, {
      method: req.method,
      headers: req.headers,
      ...(hasBody
        ? { body: Readable.toWeb(req), duplex: "half" }
        : {}),
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body || req.method === "HEAD") {
      res.end();
      return;
    }

    await pipeline(Readable.fromWeb(response.body), res);
  } catch (error) {
    console.error("Request failed:", error);

    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }

    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server running on port ${PORT}`);
});
