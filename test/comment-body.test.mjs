import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeploymentTargetsTable,
  buildVersionLink,
} from "../src/services/github/preview-links.ts";

const VERSION_LINK_PATTERN = /\[Version ↗]\(https:\/\/version\.example\.com\)/;
const ENVIRONMENT_LINK_PATTERN =
  /\| jarvis \| Environment \| \[staging ↗]\(https:\/\/staging\.example\.com\) \|/;
const TAG_LINK_PATTERN =
  /\| jarvis \| Tag \| \[pr-94 ↗]\(https:\/\/pr-94\.example\.com\) \|/;
const ESCAPED_TAG_LINK_PATTERN =
  /\| jarvis \| Tag \| \[release\\\|candidate\\\] ↗]\(https:\/\/release\.example\.com\) \|/;
const TARGETS_HEADING_PATTERN = /#### Affected deployment targets/;
const TARGETS_HEADER_PATTERN = /\| Application \| Type \| Target \|/;

test("shows the version link in the deployment table", () => {
  const body = buildVersionLink({
    projectName: "jarvis",
    urls: ["https://version.example.com"],
  });

  assert.match(body, VERSION_LINK_PATTERN);
});

test("shows affected environments and tags in a separate table", () => {
  const body = buildDeploymentTargetsTable([
    {
      dashboardUrl: "https://app.zephyr-cloud.io/version",
      deployedAt: Date.UTC(2026, 7, 3, 12, 0),
      environmentUrls: [
        { name: "staging", url: "https://staging.example.com" },
      ],
      projectName: "jarvis",
      tagUrls: [{ name: "pr-94", url: "https://pr-94.example.com" }],
      urls: ["https://version.example.com"],
    },
  ]);

  assert.ok(body);
  assert.match(body, TARGETS_HEADING_PATTERN);
  assert.match(body, TARGETS_HEADER_PATTERN);
  assert.match(body, ENVIRONMENT_LINK_PATTERN);
  assert.match(body, TAG_LINK_PATTERN);
});

test("escapes target names that could break the deployment table", () => {
  const body = buildDeploymentTargetsTable([
    {
      projectName: "jarvis",
      tagUrls: [
        { name: "release|candidate]", url: "https://release.example.com" },
      ],
      urls: ["https://version.example.com"],
    },
  ]);

  assert.ok(body);
  assert.match(body, ESCAPED_TAG_LINK_PATTERN);
});

test("omits the deployment targets table when no targets were affected", () => {
  const body = buildDeploymentTargetsTable([
    {
      environmentUrls: [],
      projectName: "jarvis",
      tagUrls: [],
      urls: ["https://version.example.com"],
    },
  ]);

  assert.equal(body, undefined);
});
