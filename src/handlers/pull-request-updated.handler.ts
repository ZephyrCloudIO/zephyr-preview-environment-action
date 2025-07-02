import * as core from "@actions/core";

import { createDeployment } from "../services/github/create-deployment.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestUpdated() {
  const previewEnvironmentUrls = await createPreviewEnvironment();

  await createDeployment(previewEnvironmentUrls);

  await updateComment(previewEnvironmentUrls);

  core.setOutput("preview_environment_urls", previewEnvironmentUrls.join(","));
}
