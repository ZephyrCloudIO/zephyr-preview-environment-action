import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import { createComment } from "./create-comment.service";
import {
  getCommentBody,
  mergePreviewEnvironments,
  PREVIEW_COMMENT_MARKER,
} from "./get-comment-body.service";

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

  const commentToUpdate = comments.find(
    (comment) =>
      comment.body?.includes(PREVIEW_COMMENT_MARKER) ||
      comment.body?.includes("Preview Environment")
  );

  const mergedPreviewEnvironments = mergePreviewEnvironments(
    commentToUpdate?.body,
    previewEnvironments
  );

  const commentBody = getCommentBody(mergedPreviewEnvironments, prActionType);

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
