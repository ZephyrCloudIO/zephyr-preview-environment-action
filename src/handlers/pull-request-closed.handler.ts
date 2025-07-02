import * as core from "@actions/core";

import { createDeployment } from "../services/github/create-deployment.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestClosed() {
  const previewEnvironmentUrl = await createPreviewEnvironment();

  const isPrClosed = true;
  await createDeployment(previewEnvironmentUrl, isPrClosed);

  await updateComment(previewEnvironmentUrl, isPrClosed);

  core.setOutput("preview_environment_url", previewEnvironmentUrl);
}
