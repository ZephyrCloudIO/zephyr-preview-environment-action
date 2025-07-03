import * as core from "@actions/core";

import { deactivateDeployments } from "../services/github/deactivate-deployments.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironment } from "../services/zephyr/create-preview-environment.service";

export async function handlePullRequestClosed() {
  const previewEnvironments = await createPreviewEnvironment();

  const isPrClosed = true;
  await updateComment(previewEnvironments, isPrClosed);

  await deactivateDeployments(previewEnvironments);

  core.setOutput(
    "preview_environments_urls",
    JSON.stringify(
      previewEnvironments.map(
        (previewEnvironment) => previewEnvironment.urls[0],
      ),
    ),
  );
}
