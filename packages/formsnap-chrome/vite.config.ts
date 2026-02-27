import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    preact(),
    {
      name: "copy-manifest",
      closeBundle() {
        mkdirSync("dist/icons", { recursive: true });
        copyFileSync("manifest.json", "dist/manifest.json");
      },
    },
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/index.html"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "content") return "content/[name].js";
          return "[name]/[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (asset) => {
          if (asset.name?.endsWith(".html")) return "[name]/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  resolve: {
    alias: {
      formsnap: new URL("../formsnap/src/index.ts", import.meta.url).pathname,
    },
  },
});
