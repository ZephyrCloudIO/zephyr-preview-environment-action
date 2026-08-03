import assert from "node:assert/strict";
import test from "node:test";

import { findAffectedDeploymentTargets } from "../src/services/zephyr/get-affected-deployment-targets.ts";

test("selects only tag and environment URLs assigned to the deployed snapshot", () => {
  const targets = findAffectedDeploymentTargets(
    {
      entities: [
        {
          deployTarget: "environment",
          deployTargetName: "staging",
          hostUrl: "https://staging.example.com",
          snapshot_id: "snapshot-current",
        },
        {
          deployTarget: "tag",
          deployTargetName: "pr-94",
          hostUrl: "https://pr-94.example.com",
          snapshot_id: "snapshot-current",
        },
        {
          deployTarget: "environment",
          deployTargetName: "production",
          hostUrl: "https://production.example.com",
          snapshot_id: "snapshot-previous",
        },
      ],
    },
    "snapshot-current"
  );

  assert.deepEqual(targets, {
    environmentUrls: [{ name: "staging", url: "https://staging.example.com" }],
    tagUrls: [{ name: "pr-94", url: "https://pr-94.example.com" }],
  });
});

test("ignores malformed, unsafe, and duplicate targets", () => {
  const duplicate = {
    deployTarget: "tag",
    deployTargetName: "latest",
    hostUrl: "https://latest.example.com",
    snapshot_id: "snapshot-current",
  };
  const targets = findAffectedDeploymentTargets(
    {
      entities: [
        duplicate,
        duplicate,
        { ...duplicate, hostUrl: "javascript:alert(1)" },
        { ...duplicate, deployTarget: "unknown" },
      ],
    },
    "snapshot-current"
  );

  assert.deepEqual(targets, {
    environmentUrls: [],
    tagUrls: [{ name: "latest", url: "https://latest.example.com" }],
  });
});
