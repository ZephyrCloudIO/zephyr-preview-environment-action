import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import { createComment } from "./create-comment.service";
import {
  getCommentBody,
  mergePreviewEnvironments,
} from "./get-comment-body.service";
import {
  findCurrentPreviewComment,
  findManagedPreviewComments,
  findPersistentPreviewComment,
  getPreviewCommentOperations,
} from "./preview-comment";

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

  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo: repoName,
    issue_number: prNumber,
    per_page: 100,
  });

  const managedComments = findManagedPreviewComments(comments);
  const currentComment = findCurrentPreviewComment(comments);
  const persistentComment = findPersistentPreviewComment(comments);

  const mergedPreviewEnvironments = mergePreviewEnvironments(
    currentComment?.body,
    previewEnvironments
  );

  const operations = getPreviewCommentOperations(
    managedComments.length > 0,
    prActionType
  );

  for (const operation of operations) {
    if (operation === "create-active") {
      await createComment(mergedPreviewEnvironments);
      continue;
    }

    if (operation === "update-existing") {
      if (!persistentComment) {
        throw new Error("Persistent preview comment not found");
      }

      await octokit.rest.issues.updateComment({
        owner,
        repo: repoName,
        comment_id: persistentComment.id,
        body: getCommentBody(mergedPreviewEnvironments),
      });
    }

    const commentsToDelete =
      operation === "delete-existing"
        ? managedComments
        : managedComments.filter(
            (comment) => comment.id !== persistentComment?.id
          );

    for (const comment of commentsToDelete) {
      await octokit.rest.issues.deleteComment({
        owner,
        repo: repoName,
        comment_id: comment.id,
      });
    }
  }
}
