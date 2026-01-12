import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import { getCommentBody } from "./get-comment-body.service";
import { getJobName } from "./get-job-name.service";

export async function createComment(
  previewEnvironments: PreviewEnvironment[]
): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo, payload } = context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const { number: prNumber } = payload.pull_request;

  const jobName = getJobName();
  const commentBody = getCommentBody(previewEnvironments, undefined, jobName);

  await octokit.rest.issues.createComment({
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: commentBody,
  });
}
