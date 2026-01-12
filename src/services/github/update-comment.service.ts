import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import { createComment } from "./create-comment.service";
import { getCommentBody } from "./get-comment-body.service";
import { getJobName } from "./get-job-name.service";

export async function updateComment(
  previewEnvironments: PreviewEnvironment[],
  prActionType?: "updated" | "closed"
): Promise<void> {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);

  const { repo, payload } = context;
  const { owner, repo: repoName } = repo;

  if (!payload.pull_request) {
    throw new Error("Pull request data not found");
  }

  const { number: prNumber } = payload.pull_request;

  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo: repoName,
    issue_number: prNumber,
  });

  const jobName = getJobName();
  const jobMarker = `<!-- zephyr-job-id: ${jobName} -->`;

  const commentToUpdate = comments.find((comment) => {
    // Primary: search for exact job marker
    if (comment.body?.includes(jobMarker)) {
      return true;
    }

    // Secondary: backwards compatibility for "default" job
    if (
      jobName === "default" &&
      comment.body?.includes("Preview Environment")
    ) {
      return true;
    }

    return false;
  });

  const commentBody = getCommentBody(
    previewEnvironments,
    prActionType,
    jobName
  );

  if (commentToUpdate) {
    await octokit.rest.issues.updateComment({
      owner,
      repo: repoName,
      comment_id: commentToUpdate.id,
      body: commentBody,
    });

    return;
  }

  // Workaround to create a comment if was not created properly in the pull_request_opened or pull_request_updated event by any reason
  if (prActionType !== "closed") {
    await createComment(previewEnvironments);
  }
}
