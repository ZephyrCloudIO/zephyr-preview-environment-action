import assert from "node:assert/strict";
import test from "node:test";

import { getDashboardVersionUrl } from "../src/services/zephyr/get-dashboard-url.ts";

test("builds the exact dashboard route for a deployed version", () => {
  const dashboardUrl = getDashboardVersionUrl({
    creator: {
      email: "nestor@nstlopez.com",
      name: "nestor_lopez",
    },
    uid: {
      app_name: "jarvis",
      build: "32004",
      org: "zephyrcloudio",
      repo: "zephyr-preview-environment-action",
    },
    version: "0.0.0-feat/refresh-deployment-comments.32004",
  });

  assert.equal(
    dashboardUrl,
    "https://app.zephyr-cloud.io/org/zephyrcloudio/zephyr-preview-environment-action/app/jarvis/versions/0~0~0-feat%2Frefresh-deployment-comments~nestor_lopez~32004"
  );
});

test("does not duplicate a creator already included in a local version", () => {
  const dashboardUrl = getDashboardVersionUrl({
    creator: {
      email: "nestor@nstlopez.com",
      name: "nestor_lopez",
    },
    uid: {
      app_name: "jarvis",
      build: "32004",
      org: "zephyrcloudio",
      repo: "zephyr-preview-environment-action",
    },
    version: "0.0.0-nestor_lopez.32004",
  });

  assert.equal(
    dashboardUrl,
    "https://app.zephyr-cloud.io/org/zephyrcloudio/zephyr-preview-environment-action/app/jarvis/versions/0~0~0-nestor_lopez~32004"
  );
});
