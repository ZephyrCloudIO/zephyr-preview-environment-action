import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const BUNDLE_PATH = fileURLToPath(new URL("../index.js", import.meta.url));
const NOT_A_PULL_REQUEST = /only be triggered on pull requests/;

// Regression: zephyr-agent's ESM build calls createRequire(import.meta.url) while the
// bundle loads. A bundler that leaves it empty in CommonJS output ships an index.js
// that throws before the action runs.
test("the committed bundle loads and exits cleanly outside a pull request", () => {
  const result = spawnSync(process.execPath, [BUNDLE_PATH], {
    encoding: "utf8",
    env: {
      GITHUB_EVENT_NAME: "push",
      HOME: mkdtempSync(join(tmpdir(), "zephyr-preview-action-bundle-")),
      PATH: process.env.PATH,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, NOT_A_PULL_REQUEST);
});
