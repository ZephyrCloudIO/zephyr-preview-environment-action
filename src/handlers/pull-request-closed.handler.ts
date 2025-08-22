import * as core from "@actions/core";

import { deactivateDeployments } from "../services/github/deactivate-deployments.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestClosed(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  const isPrClosed = true;
  await updateComment(previewEnvironments, isPrClosed);

  // Disabling deployment creation for now to avoid wall of comments
  // await deactivateDeployments(previewEnvironments);

  // core.setOutput(
  //   "preview_environments_urls",
  //   JSON.stringify(
  //     previewEnvironments.map(
  //       (previewEnvironment) => previewEnvironment.urls[0],
  //     ),
  //   ),
  // );
}
