import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const port = Number.parseInt(process.env.PORT || "4173", 10);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    ...headers,
  });
  res.end(body);
}

function resolveFilePath(requestUrl) {
  const url = new URL(requestUrl, `http://127.0.0.1:${port}`);
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const relativePath = pathname.replace(/^\/+/, "");
  const filePath = path.resolve(rootDir, relativePath);

  if (filePath !== rootDir && !filePath.startsWith(`${rootDir}${path.sep}`)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    send(res, 400, "Bad request");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed", { Allow: "GET, HEAD" });
    return;
  }

  const filePath = resolveFilePath(req.url);
  if (!filePath) {
    send(res, 400, "Bad request path");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      send(res, 404, "Not found");
      return;
    }

    const finalPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;

    fs.stat(finalPath, (finalStatError, finalStats) => {
      if (finalStatError || !finalStats.isFile()) {
        send(res, 404, "Not found");
        return;
      }

      const extension = path.extname(finalPath).toLowerCase();
      const contentType = mimeTypes[extension] || "application/octet-stream";
      const headers = {
        "Content-Type": contentType,
        "Content-Length": finalStats.size,
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      };

      if (extension === ".html") {
        headers["Cache-Control"] = "no-store";
      }

      res.writeHead(200, headers);

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = fs.createReadStream(finalPath);
      stream.on("error", () => {
        if (!res.headersSent) {
          send(res, 500, "Failed to read file");
          return;
        }
        res.destroy();
      });
      stream.pipe(res);
    });
  });
});

server.listen(port, () => {
  process.stdout.write(`Preview server running at http://127.0.0.1:${port}\n`);
  process.stdout.write("Press Ctrl+C to stop the server.\n");
});

server.on("error", (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
