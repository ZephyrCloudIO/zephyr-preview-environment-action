import { createDeployments } from "../services/github/create-deployments.service";
import { setOutput } from "../services/github/set-output.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestUpdated(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  // Create deployments first (source of truth for comments)
  await createDeployments(previewEnvironments);

  // Update comment by querying all deployments
  const prActionType = "updated";
  await updateComment(prActionType);

  setOutput(previewEnvironments);
}
