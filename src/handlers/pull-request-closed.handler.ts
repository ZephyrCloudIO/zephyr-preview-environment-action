import { setOutput } from "@actions/core";

import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestClosed(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  const prActionType = "closed";
  await updateComment(previewEnvironments, prActionType);

  // Disabling deployment creation for now to avoid wall of comments
  // await deactivateDeployments(previewEnvironments);

  setOutput(
    "preview_environments_urls",
    JSON.stringify(
      previewEnvironments.map(
        (previewEnvironment) => previewEnvironment.urls[0]
      )
    )
  );
}
