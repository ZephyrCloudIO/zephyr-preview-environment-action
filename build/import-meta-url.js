// esbuild leaves `import.meta.url` empty in CommonJS output. zephyr-agent's ESM build
// calls createRequire(import.meta.url) at module load, so the bundle needs a real value.
// Injected by the `build` script and mapped with --define:import.meta.url=importMetaUrl.
export const importMetaUrl = require("node:url").pathToFileURL(
  __filename
).href;
