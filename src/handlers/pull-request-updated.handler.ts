import * as core from "@actions/core";

import { createDeployments } from "../services/github/create-deployments.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestUpdated() {
  const previewEnvironments = await createPreviewEnvironment();

  await createDeployments(previewEnvironments);

  await updateComment(previewEnvironments);

  core.setOutput(
    "preview_environments_urls",
    JSON.stringify(
      previewEnvironments.map(
        (previewEnvironment) => previewEnvironment.urls[0],
      ),
    ),
  );
}
