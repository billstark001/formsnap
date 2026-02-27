import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Virtual module plugin to inject bookmarklet strings
function bookmarkletPlugin() {
  const virtualModuleId = "virtual:bookmarklets";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "bookmarklet-inline",
    resolveId(id: string) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const distDir = path.resolve(__dirname, "dist-bookmarklets");
        let collector = "";
        let filler = "";
        try {
          collector = fs.readFileSync(path.join(distDir, "collector.js"), "utf-8").trim();
          filler = fs.readFileSync(path.join(distDir, "filler.js"), "utf-8").trim();
        } catch {
          // During dev, bookmarklets may not be built yet
          collector = "/* build bookmarklets first */";
          filler = "/* build bookmarklets first */";
        }
        return `
export const collectorCode = ${JSON.stringify(collector)};
export const fillerCode = ${JSON.stringify(filler)};
        `.trim();
      }
    },
  };
}

export default defineConfig({
  plugins: [
    preact(),
    bookmarkletPlugin(),
  ],
});
