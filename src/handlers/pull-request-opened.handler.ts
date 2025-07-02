import * as core from "@actions/core";

import { createComment } from "../services/github/create-comment.service";
import { createDeployment } from "../services/github/create-deployment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestOpened(): Promise<void> {
  const previewEnvironmentUrl = await createPreviewEnvironment();

  await createDeployment(previewEnvironmentUrl);

  await createComment(previewEnvironmentUrl);

  core.setOutput("preview_environment_url", previewEnvironmentUrl);
}
