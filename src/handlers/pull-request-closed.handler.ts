import * as core from "@actions/core";

import { createDeployment } from "../services/github/create-deployment.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestClosed() {
  const previewEnvironmentUrls = await createPreviewEnvironment();

  const isPrClosed = true;
  await createDeployment(previewEnvironmentUrls, isPrClosed);

  await updateComment(previewEnvironmentUrls, isPrClosed);

  core.setOutput("preview_environment_urls", previewEnvironmentUrls.join(","));
}
