import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { resolve } from "node:path";
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Writes a minimal 1×1 transparent PNG as a placeholder icon.
 * Real icons should be placed in the icons/ source directory.
 */
function writePlaceholderIcon(dest: string) {
  // Minimal 1x1 transparent PNG (68 bytes)
  const png = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4" +
    "890000000a49444154789c6260000000000200e221bc330000000049454e44ae426082",
    "hex"
  );
  writeFileSync(dest, png);
}

export default defineConfig({
  plugins: [
    preact(),
    vanillaExtractPlugin(),
    {
      name: "copy-manifest",
      closeBundle() {
        mkdirSync("dist/icons", { recursive: true });
        copyFileSync("manifest.json", "dist/manifest.json");
        // Copy source icons if they exist; otherwise write placeholders
        for (const size of [16, 48, 128]) {
          const src = `icons/icon${size}.png`;
          const dest = `dist/icons/icon${size}.png`;
          if (existsSync(src)) {
            copyFileSync(src, dest);
          } else {
            writePlaceholderIcon(dest);
          }
        }
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
