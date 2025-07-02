import * as core from "@actions/core";

import { createComment } from "../services/github/create-comment.service";
import { createDeployment } from "../services/github/create-deployment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestOpened(): Promise<void> {
  const previewEnvironmentUrls = await createPreviewEnvironment();

  await createDeployment(previewEnvironmentUrls);

  await createComment(previewEnvironmentUrls);

  core.setOutput("preview_environment_urls", previewEnvironmentUrls.join(","));
}
