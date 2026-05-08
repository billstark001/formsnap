import typescript from "@rollup/plugin-typescript";

/** @type {import('rollup').RollupOptions} */
const config = {
  input: [
    "src/index.ts",
    "src/shared/index.ts",
    "src/dom/index.ts",
    "src/analysis/index.ts",
    "src/rules/index.ts",
    "src/snapshot/index.ts",
    "src/restore/index.ts",
    "src/adapters/index.ts",
  ],
  output: [
    {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
  ],
  plugins: [typescript({ tsconfig: "./tsconfig.json" })],
};

export default config;
