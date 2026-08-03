import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import { createComment } from "./create-comment.service";
import {
  getCommentBody,
  mergePreviewEnvironments,
} from "./get-comment-body.service";
import {
  findActivePreviewComment,
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

  const activeComment = findActivePreviewComment(comments);

  const mergedPreviewEnvironments = mergePreviewEnvironments(
    activeComment?.body,
    previewEnvironments
  );

  const operations = getPreviewCommentOperations(
    Boolean(activeComment),
    prActionType
  );

  for (const operation of operations) {
    if (operation === "create-active") {
      await createComment(
        mergedPreviewEnvironments,
        prActionType === "updated" ? "updated" : undefined
      );
      continue;
    }

    if (!activeComment) {
      throw new Error("Active preview comment not found");
    }

    await octokit.rest.issues.updateComment({
      owner,
      repo: repoName,
      comment_id: activeComment.id,
      body: getCommentBody(
        mergedPreviewEnvironments,
        operation === "close-active" ? "closed" : "superseded"
      ),
    });
  }
}
