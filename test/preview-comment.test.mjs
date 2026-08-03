import assert from "node:assert/strict";
import test from "node:test";

import {
  findCurrentPreviewComment,
  findManagedPreviewComments,
  findPersistentPreviewComment,
  getPreviewCommentOperations,
  PREVIEW_COMMENT_ACTIVE_MARKER,
  PREVIEW_COMMENT_MARKER,
} from "../src/services/github/preview-comment.ts";

function comment(id, body, createdAt) {
  return {
    id,
    body,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

test("selects every managed comment for lifecycle management", () => {
  const markedComment = comment(
    1,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_ACTIVE_MARKER}`,
    "2026-08-03T10:00:00Z"
  );
  const legacyComment = comment(
    2,
    "🚀 **Preview Environment Ready!**\n\n| Name | Status | URL |\n|----|----------|--------|",
    "2026-08-03T11:00:00Z"
  );
  const unrelatedComment = comment(
    3,
    "Can we improve the Preview Environment documentation?",
    "2026-08-03T12:00:00Z"
  );

  assert.deepEqual(
    findManagedPreviewComments([
      markedComment,
      legacyComment,
      unrelatedComment,
    ]).map(({ id }) => id),
    [markedComment.id, legacyComment.id]
  );
});

test("merges from the active comment instead of inactive history", () => {
  const activeComment = comment(
    1,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_ACTIVE_MARKER}`,
    "2026-08-03T10:00:00Z"
  );
  const inactiveComment = comment(
    2,
    `${PREVIEW_COMMENT_MARKER}\n<!-- zephyr-preview-environments-status:superseded -->`,
    "2026-08-03T11:00:00Z"
  );

  assert.equal(
    findCurrentPreviewComment([activeComment, inactiveComment])?.id,
    activeComment.id
  );
});

test("keeps the oldest managed comment in its original position", () => {
  const oldestComment = comment(
    1,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_ACTIVE_MARKER}`,
    "2026-08-03T10:00:00Z"
  );
  oldestComment.updated_at = "2026-08-03T12:00:00Z";
  const newerComment = comment(
    2,
    `${PREVIEW_COMMENT_MARKER}\n${PREVIEW_COMMENT_ACTIVE_MARKER}`,
    "2026-08-03T11:00:00Z"
  );

  assert.equal(
    findPersistentPreviewComment([newerComment, oldestComment])?.id,
    oldestComment.id
  );
});

test("migrates the newest legacy generated comment", () => {
  const olderComment = comment(
    1,
    "🚀 **Preview Environment Ready!**\n\n| Name | Status | URL |\n|----|----------|--------|",
    "2026-08-03T10:00:00Z"
  );
  const newerComment = comment(
    2,
    "**Preview Environment Deactivated! (deploy)**\n\n| Name | Status | URL |\n|--------|--------|--------|",
    "2026-08-03T11:00:00Z"
  );

  assert.equal(
    findCurrentPreviewComment([olderComment, newerComment])?.id,
    newerComment.id
  );
});

test("updates the existing comment for the next deployment", () => {
  assert.deepEqual(getPreviewCommentOperations(true, "updated"), [
    "update-existing",
  ]);
});

test("deletes old comments without creating another on PR close", () => {
  assert.deepEqual(getPreviewCommentOperations(true, "closed"), [
    "delete-existing",
  ]);
  assert.deepEqual(getPreviewCommentOperations(false, "closed"), []);
});

test("creates the first deployment comment when none exists", () => {
  assert.deepEqual(getPreviewCommentOperations(false, undefined), [
    "create-active",
  ]);
});
