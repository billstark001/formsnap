import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

/** @type {import('rollup').RollupOptions[]} */
const configs = [
  {
    input: "src/bookmarklets/collector.ts",
    output: {
      file: "dist-bookmarklets/collector.js",
      format: "iife",
      name: "_fsCollector",
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
  {
    input: "src/bookmarklets/filler.ts",
    output: {
      file: "dist-bookmarklets/filler.js",
      format: "iife",
      name: "_fsFiller",
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
];

export default configs;
