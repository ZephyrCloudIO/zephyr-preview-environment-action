import assert from "node:assert/strict";
import test from "node:test";

import { buildPreviewLinks } from "../src/services/github/preview-links.ts";

const VERSION_LINK_PATTERN = /\[Version ↗]\(https:\/\/version\.example\.com\)/;
const ENVIRONMENT_LINK_PATTERN =
  /Environments: \[staging ↗]\(https:\/\/staging\.example\.com\)/;
const TAG_LINK_PATTERN = /Tags: \[pr-94 ↗]\(https:\/\/pr-94\.example\.com\)/;
const ESCAPED_TAG_LINK_PATTERN =
  /Tags: \[release\\\|candidate\\\] ↗]\(https:\/\/release\.example\.com\)/;

test("shows version, affected environment, and affected tag links", () => {
  const body = buildPreviewLinks({
    dashboardUrl: "https://app.zephyr-cloud.io/version",
    deployedAt: Date.UTC(2026, 7, 3, 12, 0),
    environmentUrls: [{ name: "staging", url: "https://staging.example.com" }],
    projectName: "jarvis",
    tagUrls: [{ name: "pr-94", url: "https://pr-94.example.com" }],
    urls: ["https://version.example.com"],
  });

  assert.match(body, VERSION_LINK_PATTERN);
  assert.match(body, ENVIRONMENT_LINK_PATTERN);
  assert.match(body, TAG_LINK_PATTERN);
});

test("escapes target names that could break the deployment table", () => {
  const body = buildPreviewLinks({
    projectName: "jarvis",
    tagUrls: [
      { name: "release|candidate]", url: "https://release.example.com" },
    ],
    urls: ["https://version.example.com"],
  });

  assert.match(body, ESCAPED_TAG_LINK_PATTERN);
});
