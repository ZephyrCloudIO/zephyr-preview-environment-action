import { setOutput } from "@actions/core";

import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestUpdated(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  // Disabling deployment creation for now to avoid wall of comments
  // await createDeployments(previewEnvironments);

  const prActionType = "updated";
  await updateComment(previewEnvironments, prActionType);

  setOutput(
    "preview_environments_urls",
    JSON.stringify(
      previewEnvironments.map(
        (previewEnvironment) => previewEnvironment.urls[0]
      )
    )
  );
}
