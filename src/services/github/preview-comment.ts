export const PREVIEW_COMMENT_MARKER = "<!-- zephyr-preview-environments -->";
export const PREVIEW_COMMENT_ACTIVE_MARKER =
  "<!-- zephyr-preview-environments-status:active -->";

const PREVIEW_COMMENT_STATUS_MARKER_PREFIX =
  "<!-- zephyr-preview-environments-status:";
const LEGACY_PREVIEW_COMMENT_TITLE_PATTERN =
  /^(?:🚀\s*)?\*\*Preview Environment (?:Ready!|Deactivated!)(?: \([^)]+\))?\*\*$|^(?:⏳|❌)\s*\*\*Preview Environment — (?:Awaiting Approval|Deployment Rejected)\*\*$/m;
const LEGACY_PREVIEW_COMMENT_TABLE_PATTERN =
  /^\|\s*-{2,}\s*\|\s*-{2,}\s*\|\s*-{2,}\s*\|$/m;

interface PreviewComment {
  body?: null | string;
  created_at: string;
  id: number;
  updated_at?: null | string;
}

type PullRequestAction = "closed" | "updated" | undefined;
type PreviewCommentOperation = "create-active" | "delete-existing";

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

function isLegacyPreviewComment(body: string): boolean {
  return (
    LEGACY_PREVIEW_COMMENT_TITLE_PATTERN.test(body) &&
    LEGACY_PREVIEW_COMMENT_TABLE_PATTERN.test(body)
  );
}

export function findManagedPreviewComments<T extends PreviewComment>(
  comments: T[]
): T[] {
  return comments.filter((comment) => {
    const body = comment.body;

    return Boolean(
      body &&
        (body.includes(PREVIEW_COMMENT_MARKER) || isLegacyPreviewComment(body))
    );
  });
}

export function findCurrentPreviewComment<T extends PreviewComment>(
  comments: T[]
): T | undefined {
  const managedComments = findManagedPreviewComments(comments);
  const activeComment = findNewestComment(
    managedComments.filter((comment) =>
      comment.body?.includes(PREVIEW_COMMENT_ACTIVE_MARKER)
    )
  );

  if (activeComment) {
    return activeComment;
  }

  return findNewestComment(
    managedComments.filter(
      (comment) => !comment.body?.includes(PREVIEW_COMMENT_STATUS_MARKER_PREFIX)
    )
  );
}

export function getPreviewCommentOperations(
  hasManagedComments: boolean,
  pullRequestAction: PullRequestAction
): PreviewCommentOperation[] {
  const operations: PreviewCommentOperation[] = [];

  if (hasManagedComments) {
    operations.push("delete-existing");
  }

  if (pullRequestAction !== "closed") {
    operations.push("create-active");
  }

  return operations;
}
