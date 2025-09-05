import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

export async function validateWorkflowPermissions(): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const missingPermissions: string[] = [];

  try {
    // Test contents:read permission
    await octokit.rest.repos.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  } catch {
    missingPermissions.push("contents:read");
  }

  try {
    // Test pull-requests:write permission by trying to list comments
    const pullRequestNumber = context.payload.pull_request?.number;
    if (pullRequestNumber) {
      await octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pullRequestNumber,
      });
    }
  } catch {
    missingPermissions.push("pull-requests:write");
  }

  try {
    // Test deployments:write permission by trying to list deployments
    await octokit.rest.repos.listDeployments({
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  } catch {
    missingPermissions.push("deployments:write");
  }

  if (missingPermissions.length > 0) {
    throw new Error(
      `Missing required workflow permissions: ${missingPermissions.join(", ")}. Add these to your workflow YAML:\n` +
        "permissions:\n" +
        "  deployments: write\n" +
        "  pull-requests: write\n" +
        "  contents: read"
    );
  }
}
