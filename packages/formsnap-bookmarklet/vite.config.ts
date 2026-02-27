import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Copy bookmarklet files to the site dist root after site build
function copyBookmarkletPlugin() {
  return {
    name: "copy-bookmarklet-to-dist",
    apply: "build" as const,
    closeBundle() {
      const files = ["formsnap.js"];
      const srcDir = path.resolve(__dirname, "dist-bookmarklets");
      const destDir = path.resolve(__dirname, "dist");
      for (const file of files) {
        const src = path.join(srcDir, file);
        const dest = path.join(destDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    },
  };
}

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
        let code = "";
        try {
          code = fs.readFileSync(path.join(distDir, "formsnap.js"), "utf-8").trim();
        } catch {
          // During dev, bookmarklets may not be built yet
          code = "/* build bookmarklets first */";
        }
        const remoteUrl = process.env.VITE_REMOTE_URL ?? "https://billstark001.github.io/formsnap/formsnap.js";
        const loaderCode =
          `var s=document.createElement('script');` +
          `s.src=${JSON.stringify(remoteUrl)};` +
          `s.onerror=function(){alert('FormSnap: Failed to load script (blocked by CORS/CSP or network error). Try again later or use the full script.');};` +
          `document.head.appendChild(s);`;
        return [
          `export const bookmarkletCode = ${JSON.stringify(code)};`,
          `export const bookmarkletLoaderCode = ${JSON.stringify(loaderCode)};`,
        ].join("\n");
      }
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [
    preact(),
    vanillaExtractPlugin(),
    bookmarkletPlugin(),
    copyBookmarkletPlugin(),
  ],
});
