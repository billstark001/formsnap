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
 * Phase 2 (closeBundle): after Vite flushes all assets to disk,
 * read the extracted `style.css`, fill in the placeholder in `formsnap.js`,
 * then delete `style.css` so only one self-contained file remains.
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
      const cssPath = path.join(distDir, "style.css");
      const jsPath = path.join(distDir, "formsnap.js");
      if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) return;

      const css = fs.readFileSync(cssPath, "utf-8").trim();
      let js = fs.readFileSync(jsPath, "utf-8");
      js = js.replace(`var __FS_CSS__="";`, `var __FS_CSS__=${JSON.stringify(css)};`);
      fs.writeFileSync(jsPath, js);
      fs.unlinkSync(cssPath);
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
    emptyOutDir: false,
    cssCodeSplit: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
