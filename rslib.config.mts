import { defineConfig } from "@rslib/core";

// GitHub runs the committed `index.js` directly, with no `node_modules`, so the build
// is one self-contained CommonJS file at the repository root.
export default defineConfig({
  lib: [
    {
      bundle: true,
      dts: false,
      format: "cjs",
      syntax: "es2024",
    },
  ],
  output: {
    // Bundle every dependency instead of leaving package.json dependencies external.
    autoExternal: false,
    // The output directory is the repository root: never clean it.
    cleanDistPath: false,
    distPath: { root: "./" },
    // Optional modules that dependencies load inside a try/catch (proxy-agent-negotiate
    // and debug). Neither is installed, so the lookups stay runtime failures as intended.
    externals: ["kerberos", "supports-color"],
    filename: { js: "index.js" },
    legalComments: "inline",
    minify: true,
    target: "node",
  },
  source: {
    entry: { index: "./src/index.ts" },
  },
  tools: {
    rspack: {
      // Dynamic imports must stay in index.js; a second chunk would never be shipped.
      module: {
        parser: { javascript: { dynamicImportMode: "eager" } },
      },
      optimization: { splitChunks: false },
    },
  },
});
