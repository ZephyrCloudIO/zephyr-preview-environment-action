import * as core from "@actions/core";
import * as github from "@actions/github";

import { createComment } from "./create-comment.service";
import { getCommentBody } from "./get-comment-body.service";

export async function updateComment(
  previewEnvironmentUrl: string,
  isPrClosed?: boolean,
): Promise<void> {
  const githubToken = core.getInput("github_token");
  const octokit = github.getOctokit(githubToken);

  const { repo, payload } = github.context;
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

  const comment = comments.find((comment) =>
    comment.body?.includes("Preview Environment"),
  );

  const commentBody = getCommentBody(previewEnvironmentUrl, isPrClosed);

  if (comment) {
    await octokit.rest.issues.updateComment({
      owner,
      repo: repoName,
      comment_id: comment.id,
      body: commentBody,
    });

    return;
  }

  // Workaround to create a comment if was not created properly in the pull_request_opened event by any reason
  if (!isPrClosed) {
    await createComment(previewEnvironmentUrl);
  }
}
