import { readdir, rename, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Next.js can emit nested RSC files on Windows while the client requests flat names.
// https://github.com/vercel/next.js/issues/85374
async function flattenSegments(directory, route, parts) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const source = join(directory, entry.name);
    const pathParts = [...parts, entry.name];
    if (entry.isDirectory()) {
      await flattenSegments(source, route, pathParts);
    } else if (entry.isFile() && entry.name.endsWith(".txt")) {
      await rename(source, join(route, pathParts.join(".")));
    }
  }
  await rmdir(directory);
}

async function normalizeRoutes(route) {
  const entries = await readdir(route, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "_next") continue;
    const directory = join(route, entry.name);
    if (entry.name.startsWith("__next.")) {
      await flattenSegments(directory, route, [entry.name]);
    } else {
      await normalizeRoutes(directory);
    }
  }
}

if (process.platform === "win32") {
  await normalizeRoutes(fileURLToPath(new URL("../out/", import.meta.url)));
}
