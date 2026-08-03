export const PREVIEW_COMMENT_MARKER = "<!-- zephyr-preview-environments -->";
export const PREVIEW_COMMENT_STATUS_MARKER_PREFIX =
  "<!-- zephyr-preview-environments-status:";
export const PREVIEW_COMMENT_ACTIVE_MARKER =
  "<!-- zephyr-preview-environments-status:active -->";
export const PREVIEW_COMMENT_SUPERSEDED_MARKER =
  "<!-- zephyr-preview-environments-status:superseded -->";
export const PREVIEW_COMMENT_CLOSED_MARKER =
  "<!-- zephyr-preview-environments-status:closed -->";

interface PreviewComment {
  body?: null | string;
  created_at: string;
  id: number;
  updated_at?: null | string;
}

type PullRequestAction = "closed" | "updated" | undefined;
type PreviewCommentOperation =
  | "close-active"
  | "create-active"
  | "supersede-active";

function getCommentTimestamp(comment: PreviewComment): number {
  return new Date(comment.updated_at ?? comment.created_at).getTime();
}

function findNewestComment<T extends PreviewComment>(
  comments: T[]
): T | undefined {
  return comments.toSorted(
    (leftComment, rightComment) =>
      getCommentTimestamp(rightComment) - getCommentTimestamp(leftComment)
  )[0];
}

export function findActivePreviewComment<T extends PreviewComment>(
  comments: T[]
): T | undefined {
  const activeComment = findNewestComment(
    comments.filter((comment) =>
      comment.body?.includes(PREVIEW_COMMENT_ACTIVE_MARKER)
    )
  );

  if (activeComment) {
    return activeComment;
  }

  return findNewestComment(
    comments.filter((comment) => {
      const body = comment.body;

      if (!body || body.includes(PREVIEW_COMMENT_STATUS_MARKER_PREFIX)) {
        return false;
      }

      return (
        body.includes(PREVIEW_COMMENT_MARKER) ||
        body.includes("Preview Environment")
      );
    })
  );
}

export function getPreviewCommentOperations(
  hasActiveComment: boolean,
  pullRequestAction: PullRequestAction
): PreviewCommentOperation[] {
  const operations: PreviewCommentOperation[] = [];

  if (hasActiveComment) {
    operations.push(
      pullRequestAction === "closed" ? "close-active" : "supersede-active"
    );
  }

  if (pullRequestAction !== "closed") {
    operations.push("create-active");
  }

  return operations;
}
