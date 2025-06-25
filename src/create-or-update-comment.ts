import * as github from "@actions/github";

// TODO: We could use another approach to store the comment id, so we don't have to fetch all comments every time
export async function createOrUpdateComment(
  githubToken: string,
  previewUrl: string
): Promise<void | string> {
  try {
    const octokit = github.getOctokit(githubToken);

    const { owner, repo } = github.context.repo;
    const { number: prNumber } = github.context.payload.pull_request!;

    // Get all comments for the pull request
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });

    // Find the comment with the preview environment ready message
    const comment = comments.find((comment) =>
      comment.body?.includes("🚀 **Preview Environment Ready!**")
    );

    const commentBody = getCommentBody(previewUrl);

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
        issue_number: prNumber,
        body: commentBody,
      });
    }
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Unknown error creating or updating comment";
  }
}

function getCommentBody(previewUrl: string): string {
  const isPrClosed = github.context.payload.pull_request?.state === "closed";

  const branch = github.context.payload.pull_request?.head?.ref;
  const latestCommit =
    github.context.payload.pull_request?.head?.sha?.substring(0, 7);

  if (isPrClosed) {
    return `**Preview Environment Deactivated!**\n\n
| Name | Status | URL |
|------|--------|-----|
| Preview | ❌ Deactivated | [${previewUrl}](${previewUrl}) |
| Latest Version | ✅ Active | [${previewUrl}](${previewUrl}) |

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|------|--------|-----|
| 😎 Preview Environment | ✅ Active | [${previewUrl}](${previewUrl}) |
| 🔥 Version | ✅ Active | [${previewUrl}](${previewUrl}) |

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Created:** ${new Date().toLocaleString()}`;
}
