import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { getCommentBodyFromDeployments } from "./get-comment-body-from-deployments.service";
import { getPRDeployments } from "./get-pr-deployments.service";
import { groupDeploymentsByCommit } from "./group-deployments-by-commit.service";

/**
 * Updates the PR comment with deployment information.
 * Uses deployments as the source of truth to reconstruct the comment,
 * ensuring eventual consistency even with concurrent jobs.
 */
export async function updateComment(
  prActionType?: "updated" | "closed"
): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo, payload } = context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const {
    number: prNumber,
    head: { sha: currentCommitSha },
  } = payload.pull_request;

  // Fetch all deployments for this PR from GitHub API (source of truth)
  const prDeployments = await getPRDeployments(prNumber);

  // Group deployments by commit SHA
  const groupedDeployments = groupDeploymentsByCommit(
    prDeployments,
    currentCommitSha
  );

  // Generate comment body from deployments
  const commentBody = getCommentBodyFromDeployments(
    groupedDeployments,
    prActionType
  );

  // Find existing comment
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo: repoName,
    issue_number: prNumber,
  });

  const commentToUpdate = comments.find((comment) =>
    comment.body?.includes("Preview Environment")
  );

  if (commentToUpdate) {
    await octokit.rest.issues.updateComment({
      owner,
      repo: repoName,
      comment_id: commentToUpdate.id,
      body: commentBody,
    });
  } else {
    // Create new comment if none exists
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: commentBody,
    });
  }
}
