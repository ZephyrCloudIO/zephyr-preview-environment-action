import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach, mock } from "node:test";

// zephyr-agent resolves its storage directory from HOME at import time, so isolate it
// before loading the module under test.
process.env.HOME = mkdtempSync(join(tmpdir(), "zephyr-preview-action-"));
for (const name of ["ZE_SECRET_TOKEN", "ZE_CI_TOKEN", "ZE_SERVER_TOKEN"]) {
  delete process.env[name];
}

const { getAffectedDeploymentTargets } = await import(
  "../src/services/zephyr/get-affected-deployment-targets.ts"
);

const MISSING_TOKEN_WARNING = /No Zephyr access token found/;
const CI_TOKEN_HINT = /ZE_CI_TOKEN/;

afterEach(() => {
  mock.restoreAll();
});

const deployResult = {
  urls: ["https://version.example.com"],
  snapshot: {
    snapshot_id: "snapshot-current",
    uid: { app_name: "host", org: "acme", repo: "web" },
  },
};

function captureWarnings() {
  const warnings = [];
  const write = process.stdout.write.bind(process.stdout);
  mock.method(process.stdout, "write", (chunk, ...rest) => {
    const text = String(chunk);
    if (text.startsWith("::warning::")) {
      warnings.push(text.trim());
      return true;
    }
    return write(chunk, ...rest);
  });
  return warnings;
}

test("queries Zephyr with the resolved access token and keeps only this snapshot's targets", async () => {
  const requests = [];
  mock.method(globalThis, "fetch", (url, init) => {
    requests.push({
      authorization: init.headers.Authorization,
      url: String(url),
    });
    return Promise.resolve(
      Response.json({
        entities: [
          {
            deployTarget: "tag",
            deployTargetName: "web_feature_octocat",
            hostUrl: "https://tag.example.com",
            snapshot_id: "snapshot-current",
          },
          {
            deployTarget: "environment",
            deployTargetName: "production",
            hostUrl: "https://production.example.com",
            snapshot_id: "snapshot-previous",
          },
        ],
      })
    );
  });

  const targets = await getAffectedDeploymentTargets(deployResult, () =>
    Promise.resolve("access-token")
  );

  assert.deepEqual(targets, {
    environmentUrls: [],
    tagUrls: [{ name: "web_feature_octocat", url: "https://tag.example.com" }],
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].authorization, "Bearer access-token");
  assert.equal(
    requests[0].url,
    "https://api.zephyr-cloud.io/v2/application/acme/web/host/versions-deployed?type=all"
  );
});

// Regression: with only ZE_CI_TOKEN the agent caches the exchanged token under a private
// key, and the action used to find nothing and skip the table without a word.
test("warns once and skips the lookup when zephyr-agent finds no token", async () => {
  const warnings = captureWarnings();
  const fetchMock = mock.method(globalThis, "fetch", () => {
    throw new Error("fetch must not run without a token");
  });

  const results = await Promise.all([
    getAffectedDeploymentTargets(deployResult),
    getAffectedDeploymentTargets(deployResult),
  ]);

  for (const targets of results) {
    assert.deepEqual(targets, { environmentUrls: [], tagUrls: [] });
  }
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], MISSING_TOKEN_WARNING);
  assert.match(warnings[0], CI_TOKEN_HINT);
});
