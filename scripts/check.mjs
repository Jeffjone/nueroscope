import { readFile, access, readdir } from "node:fs/promises";
import path from "node:path";
const files = (await readdir(".")).filter((f) => f.endsWith(".html"));
let errors = [];
for (const file of files) {
  const html = await readFile(file, "utf8");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${file}: duplicate IDs`);
  if ((html.match(/<h1[ >]/g) || []).length !== 1)
    errors.push(`${file}: expected one H1`);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    const [target, hash] = url.split("#");
    const resolved = target || file;
    try {
      await access(path.resolve(resolved));
      if (hash && resolved.endsWith(".html")) {
        const targetHtml = await readFile(resolved, "utf8");
        if (!targetHtml.includes(`id="${hash}"`))
          errors.push(`${file}: missing anchor ${url}`);
      }
    } catch {
      errors.push(`${file}: missing asset ${url}`);
    }
  }
}
for (const item of JSON.parse(
  await readFile("assets/search-index.json", "utf8"),
)) {
  const [file, hash] = item.url.split("#");
  const html = await readFile(file, "utf8");
  if (hash && !html.includes(`id="${hash}"`))
    errors.push(`Search: missing ${item.url}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Verified ${files.length} pages: headings, unique IDs, local links, assets, and search destinations.`,
);
