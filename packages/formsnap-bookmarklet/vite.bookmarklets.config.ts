import { defineConfig, Plugin } from "vite";
import preact from "@preact/preset-vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist-bookmarklets");

/**
 * Two-phase CSS inlining plugin:
 *
 * Phase 1 (generateBundle): prepend `var __FS_CSS__="";` as a placeholder into
 * the IIFE entry chunk so TypeScript's `declare const __FS_CSS__` resolves.
 *
 * Phase 2 (closeBundle): after Vite flushes all assets to disk, read every
 * extracted CSS file, fill the placeholder in `formsnap.js`, then delete the
 * CSS files so the bookmarklet remains self-contained.
 */
function inlineCssAsVarPlugin(): Plugin {
  return {
    name: "inline-css-as-var",
    apply: "build",

    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) {
          chunk.code = `var __FS_CSS__="";\n` + chunk.code;
        }
      }
    },

    closeBundle() {
      const jsPath = path.join(distDir, "formsnap.js");
      if (!fs.existsSync(jsPath) || !fs.existsSync(distDir)) return;

      const cssFiles = fs.readdirSync(distDir).filter((file) => file.endsWith(".css"));
      if (cssFiles.length === 0) return;

      const css = cssFiles
        .map((file) => fs.readFileSync(path.join(distDir, file), "utf-8").trim())
        .filter(Boolean)
        .join("\n");
      const js = fs.readFileSync(jsPath, "utf-8");
      fs.writeFileSync(
        jsPath,
        js.replace(`var __FS_CSS__="";`, `var __FS_CSS__=${JSON.stringify(css)};`),
      );

      for (const file of cssFiles) {
        fs.unlinkSync(path.join(distDir, file));
      }
    },
  };
}

export default defineConfig({
  plugins: [preact(), vanillaExtractPlugin(), inlineCssAsVarPlugin()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/bookmarklets/main.tsx"),
      name: "_fsMain",
      formats: ["iife"],
      fileName: () => "formsnap.js",
    },
    outDir: "dist-bookmarklets",
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
