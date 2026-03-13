import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const indexPath = path.join(rootDir, "index.html");
const distDir = path.join(rootDir, "dist");
const itemsToCopy = ["index.html", "assets"];

if (!fs.existsSync(indexPath)) {
  process.stderr.write("Missing index.html\n");
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });

for (const item of itemsToCopy) {
  const sourcePath = path.join(rootDir, item);
  const destinationPath = path.join(distDir, item);

  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
    continue;
  }

  fs.copyFileSync(sourcePath, destinationPath);
}

process.stdout.write("Static landing build complete. Deployment files copied to dist/.\n");
