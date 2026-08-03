import assert from "node:assert/strict";
import test from "node:test";

import {
  findActivePreviewComment,
  getPreviewCommentOperations,
  PREVIEW_COMMENT_ACTIVE_MARKER,
  PREVIEW_COMMENT_CLOSED_MARKER,
  PREVIEW_COMMENT_MARKER,
  PREVIEW_COMMENT_SUPERSEDED_MARKER,
} from "../src/services/github/preview-comment.ts";

function comment(id, body, createdAt) {
  return {
    id,
    body,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

test("selects the active comment instead of a newer superseded comment", () => {
  const activeComment = comment(
    1,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_ACTIVE_MARKER}`,
    "2026-08-03T10:00:00Z"
  );
  const supersededComment = comment(
    2,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_SUPERSEDED_MARKER}`,
    "2026-08-03T11:00:00Z"
  );

  assert.equal(
    findActivePreviewComment([activeComment, supersededComment])?.id,
    activeComment.id
  );
});

test("migrates the newest legacy preview comment", () => {
  const olderComment = comment(
    1,
    "Preview Environment Ready!",
    "2026-08-03T10:00:00Z"
  );
  const newerComment = comment(
    2,
    PREVIEW_COMMENT_MARKER,
    "2026-08-03T11:00:00Z"
  );

  assert.equal(
    findActivePreviewComment([olderComment, newerComment])?.id,
    newerComment.id
  );
});

test("does not reopen an inactive preview comment", () => {
  const closedComment = comment(
    1,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_CLOSED_MARKER}`,
    "2026-08-03T10:00:00Z"
  );

  assert.equal(findActivePreviewComment([closedComment]), undefined);
});

test("supersedes the active comment before creating the next deployment", () => {
  assert.deepEqual(getPreviewCommentOperations(true, "updated"), [
    "supersede-active",
    "create-active",
  ]);
});

test("closes the active comment without creating another on PR close", () => {
  assert.deepEqual(getPreviewCommentOperations(true, "closed"), [
    "close-active",
  ]);
  assert.deepEqual(getPreviewCommentOperations(false, "closed"), []);
});

test("creates the first deployment comment when none is active", () => {
  assert.deepEqual(getPreviewCommentOperations(false, undefined), [
    "create-active",
  ]);
});
