import { createComment } from "../services/github/create-comment.service";
import { setOutput } from '../services/github/set-output.service';
import { createPreviewEnvironments } from "../services/zephyr/create-preview-environments.service";

export async function handlePullRequestOpened(): Promise<void> {
  const previewEnvironments = await createPreviewEnvironments();

  // Disabling deployment creation for now to avoid wall of comments
  // await createDeployments(previewEnvironments);

  await createComment(previewEnvironments);

  setOutput(previewEnvironments)
}
