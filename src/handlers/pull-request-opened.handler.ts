import { createComment } from "../services/github/create-comment.service";
import { createDeployments } from "../services/github/create-deployments.service";
import { setOutput } from "../services/github/set-output.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestOpened(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  // Create deployments first (source of truth for comments)
  await createDeployments(previewEnvironments);

  // Create comment by querying deployments
  await createComment();

  setOutput(previewEnvironments);
}
