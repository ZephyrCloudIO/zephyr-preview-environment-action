import { deactivateDeployments } from "../services/github/deactivate-deployments.service";
import { setOutput } from "../services/github/set-output.service";
import { updateComment } from "../services/github/update-comment.service";
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestClosed(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  // Deactivate all deployments for this PR
  await deactivateDeployments();

  // Update comment to show deactivated status
  const prActionType = "closed";
  await updateComment(prActionType);

  setOutput(previewEnvironments);
}
