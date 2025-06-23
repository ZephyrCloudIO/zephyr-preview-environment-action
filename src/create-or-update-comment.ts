import * as github from "@actions/github";

export async function createOrUpdateComment(
  githubToken: string,
  previewUrl: string,
): Promise<void | string> {
  try {
    const octokit = github.getOctokit(githubToken);

    const { owner, repo } = github.context.repo;
    const prNumber = github.context.payload.pull_request?.number;

    // Get all comments for the pull request
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber!,
    });

    // Find the comment with the preview environment ready message
    const comment = comments.find((comment) =>
      comment.body?.includes("🚀 **Preview Environment Ready!**"),
    );

    const commentBody = `🚀 **Preview Environment Ready!**\n\nPreview URL: ${previewUrl}`;

    // If the comment exists, update it
    if (comment) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: comment.id,
        body: commentBody,
      });
    } else {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber!,
        body: commentBody,
      });
    }
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Unknown error creating or updating comment";
  }
}
