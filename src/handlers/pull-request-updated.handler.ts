import * as core from "@actions/core";

import { createDeployment } from "../services/github/create-deployment.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestUpdated() {
  const previewEnvironmentUrl = await createPreviewEnvironment();

  await createDeployment(previewEnvironmentUrl);

  await updateComment(previewEnvironmentUrl);

  core.setOutput("preview_environment_url", previewEnvironmentUrl);
}
