import * as core from "@actions/core";
import * as github from "@actions/github";

import { getCommentBody } from "./get-comment-body.service";

export async function createComment(
  previewEnvironmentUrl: string,
): Promise<void> {
  const githubToken = core.getInput("github_token");
  const octokit = github.getOctokit(githubToken);

  const { repo, payload } = github.context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const { number: prNumber } = payload.pull_request;

  const commentBody = getCommentBody(previewEnvironmentUrl);

  await octokit.rest.issues.createComment({
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: commentBody,
  });
}
