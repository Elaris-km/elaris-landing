import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const requiredPaths = [
  ".gitignore",
  "README.md",
  "index.html",
  "assets/css/styles.css",
  "assets/css/elaris-overrides.css",
  "assets/js/main.js",
  "assets/js/gsapAnimation.js",
  "assets/js/elaris-overrides.js",
  "assets/images/logo/logo.svg",
  "assets/images/logo/logo-1.svg",
  "assets/images/logo/logo-2.svg",
  "assets/images/logo/favicon.svg",
  "scripts/build-site.mjs",
  "scripts/check-site.mjs",
  "scripts/preview-site.mjs",
];

const htmlFiles = fs
  .readdirSync(rootDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"))
  .map((entry) => path.join(rootDir, entry.name));

const assetPattern = /<(?:img|script|source|video|audio|iframe|link)\b[^>]+(?:src|href)=["']([^"']+)["']/gi;
const errors = [];

function toRelative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function ensureExists(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required file: ${relativePath}`);
  }
}

function normalizeReference(rawReference) {
  const reference = rawReference.trim();
  if (!reference) {
    return null;
  }

  if (
    reference.startsWith("#") ||
    reference.startsWith("mailto:") ||
    reference.startsWith("tel:") ||
    reference.startsWith("javascript:") ||
    /^[a-z]+:/i.test(reference) ||
    reference.startsWith("//")
  ) {
    return null;
  }

  const [withoutHash] = reference.split("#", 1);
  const [withoutQuery] = withoutHash.split("?", 1);
  return withoutQuery || null;
}

function resolveReference(fromFile, reference) {
  if (reference.startsWith("/")) {
    return path.join(rootDir, reference.replace(/^\/+/, ""));
  }
  return path.resolve(path.dirname(fromFile), reference);
}

for (const relativePath of requiredPaths) {
  ensureExists(relativePath);
}

for (const htmlFile of htmlFiles) {
  const contents = fs.readFileSync(htmlFile, "utf8");
  let match;

  while ((match = assetPattern.exec(contents))) {
    const normalizedReference = normalizeReference(match[1]);
    if (!normalizedReference) {
      continue;
    }

    const resolvedPath = resolveReference(htmlFile, normalizedReference);
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`${toRelative(htmlFile)}: missing referenced file ${normalizedReference}`);
    }
  }
}

const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
if (!/<title>\s*Elaris\s*<\/title>/i.test(indexHtml)) {
  errors.push("index.html: missing <title>Elaris</title>");
}

if (!/assets\/images\/logo\/logo\.svg/i.test(indexHtml)) {
  errors.push("index.html: header logo reference was not found");
}

if (!/assets\/images\/logo\/favicon\.svg/i.test(indexHtml)) {
  errors.push("index.html: favicon reference was not found");
}

const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf8");
for (const entry of ["backups/", "output/", "test-results/"]) {
  if (!gitignore.includes(entry)) {
    errors.push(`.gitignore: missing ${entry}`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`Site checks failed (${errors.length}):\n`);
  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }
  process.exit(1);
}

process.stdout.write(`Site checks passed for ${htmlFiles.length} HTML files.\n`);




