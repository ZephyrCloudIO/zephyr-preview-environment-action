import { setOutput } from "@actions/core";

import { createComment } from "../services/github/create-comment.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestOpened(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  // Disabling deployment creation for now to avoid wall of comments
  // await createDeployments(previewEnvironments);

  await createComment(previewEnvironments);

  setOutput(
    "preview_environments_urls",
    JSON.stringify(
      previewEnvironments.map(
        (previewEnvironment) => previewEnvironment.urls[0]
      )
    )
  );
}
