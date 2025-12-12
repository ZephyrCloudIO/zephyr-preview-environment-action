import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { getCommentBodyFromDeployments } from "./get-comment-body-from-deployments.service";
import { getPRDeployments } from "./get-pr-deployments.service";
import { groupDeploymentsByCommit } from "./group-deployments-by-commit.service";

/**
 * Creates the initial PR comment with deployment information.
 * Uses deployments as the source of truth.
 */
export async function createComment(): Promise<void> {
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
  const commentBody = getCommentBodyFromDeployments(groupedDeployments);

  await octokit.rest.issues.createComment({
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: commentBody,
  });
}
