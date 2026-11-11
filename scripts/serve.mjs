import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
    );
    if (
      !file.startsWith(root + path.sep) ||
      pathname.split("/").some((p) => p.startsWith(".")) ||
      pathname.startsWith("/node_modules/")
    ) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    if (!(await stat(file)).isFile()) throw Error();
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(Number(process.env.PORT) || 4173, "127.0.0.1", () =>
  console.log("NeuroScope: http://127.0.0.1:" + server.address().port),
);
