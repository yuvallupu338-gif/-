import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = path.join(root, specifier.slice(2));
    const file = fs.existsSync(base) ? base : fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`;
    return nextResolve(pathToFileURL(file).href, context);
  }
  return nextResolve(specifier, context);
}
