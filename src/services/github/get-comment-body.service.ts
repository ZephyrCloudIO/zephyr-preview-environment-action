import { context } from "@actions/github";

import type { PreviewEnvironment } from "../../types/preview-environment";
import {
  PREVIEW_COMMENT_ACTIVE_MARKER,
  PREVIEW_COMMENT_CLOSED_MARKER,
  PREVIEW_COMMENT_MARKER,
  PREVIEW_COMMENT_SUPERSEDED_MARKER,
} from "./preview-comment";

const SHORT_COMMIT_HASH_LENGTH = 7;
const COLLAPSIBLE_THRESHOLD = 3;
const ZEPHYR_WEBSITE_URL = "https://zephyr-cloud.io/";
const TABLE_ROW_PATTERN =
  /^\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*\[[^\]]*]\(([^)]+)\)\s*\|$/gm;

type PreviewCommentAction = "updated" | "superseded" | "closed";

function truncateUrl(url: string, maxLength = 70): string {
  const ELLIPSIS = "... ↗";
  const ELLIPSIS_LENGTH = ELLIPSIS.length;

  if (url.length <= maxLength) {
    return url;
  }
  return `${url.slice(0, maxLength - ELLIPSIS_LENGTH)}${ELLIPSIS}`;
}

function buildEnvironmentRow(
  previewEnvironment: PreviewEnvironment,
  status: "active" | "superseded" | "closed"
): string {
  const url = previewEnvironment.urls[0];
  const statusLabel = {
    active: "🟢 Ready",
    closed: "⚫ Deactivated",
    superseded: "⚪ Superseded",
  }[status];

  return `| ${previewEnvironment.projectName} | ${statusLabel} | [${truncateUrl(url)}](${url}) |`;
}

function buildEnvironmentsTable(
  previewEnvironments: PreviewEnvironment[],
  status: "active" | "superseded" | "closed",
  collapsible = true
): string {
  const rows = previewEnvironments
    .map((previewEnvironment) =>
      buildEnvironmentRow(previewEnvironment, status)
    )
    .join("\n");

  const table = `| Application | Status | Preview |
| :-- | :-- | :-- |
${rows}`;

  const shouldCollapse =
    collapsible && previewEnvironments.length > COLLAPSIBLE_THRESHOLD;

  if (shouldCollapse) {
    return `<details>
<summary><b>${previewEnvironments.length} deployed applications (click to expand)</b></summary>

${table}
</details>`;
  }

  return table;
}

function getPreviewEnvironmentsFromCommentBody(
  commentBody: null | string | undefined
): PreviewEnvironment[] {
  if (!commentBody) {
    return [];
  }

  const previewEnvironments: PreviewEnvironment[] = [];

  let match = TABLE_ROW_PATTERN.exec(commentBody);

  while (match) {
    const projectName = match[1]?.trim();
    const url = match[2]?.trim();

    if (projectName && url && projectName !== "Name") {
      previewEnvironments.push({ projectName, urls: [url] });
    }

    match = TABLE_ROW_PATTERN.exec(commentBody);
  }

  return previewEnvironments;
}

export function mergePreviewEnvironments(
  existingCommentBody: null | string | undefined,
  previewEnvironments: PreviewEnvironment[]
): PreviewEnvironment[] {
  const mergedEnvironments = new Map<string, PreviewEnvironment>();

  for (const previewEnvironment of getPreviewEnvironmentsFromCommentBody(
    existingCommentBody
  )) {
    mergedEnvironments.set(previewEnvironment.projectName, previewEnvironment);
  }

  for (const previewEnvironment of previewEnvironments) {
    mergedEnvironments.set(previewEnvironment.projectName, previewEnvironment);
  }

  return Array.from(mergedEnvironments.values());
}

export function getCommentBody(
  previewEnvironments: PreviewEnvironment[],
  prActionType?: PreviewCommentAction
): string {
  const { payload, repo } = context;
  const commitSha = payload.pull_request?.head?.sha;
  const latestCommit = commitSha?.slice(0, SHORT_COMMIT_HASH_LENGTH) ?? "N/A";
  const timestamp = `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date())} UTC`;
  const commitUrl = commitSha
    ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${repo.owner}/${repo.repo}/commit/${commitSha}`
    : undefined;
  const commit = commitUrl
    ? `Commit [\`${latestCommit}\`](${commitUrl})`
    : `Commit \`${latestCommit}\``;

  if (prActionType === "closed" || prActionType === "superseded") {
    const isClosed = prActionType === "closed";
    const stateLabel = isClosed ? "Deactivated" : "Superseded";
    const statusMarker = isClosed
      ? PREVIEW_COMMENT_CLOSED_MARKER
      : PREVIEW_COMMENT_SUPERSEDED_MARKER;
    const summary = isClosed
      ? "Zephyr preview deactivated"
      : "Previous Zephyr preview superseded";
    const description = isClosed
      ? "This preview was deactivated when the pull request closed."
      : "A newer deployment is available below in the pull request.";

    return [
      PREVIEW_COMMENT_MARKER,
      statusMarker,
      "<details>",
      `<summary><strong>☁️ ${summary}</strong></summary>`,
      "",
      description,
      "",
      buildEnvironmentsTable(
        previewEnvironments,
        isClosed ? "closed" : "superseded",
        false
      ),
      "",
      `<sub>${commit} · ${stateLabel} ${timestamp}</sub>`,
      "</details>",
    ].join("\n");
  }

  const actionLabel = prActionType === "updated" ? "Updated" : "Created";

  return [
    PREVIEW_COMMENT_MARKER,
    PREVIEW_COMMENT_ACTIVE_MARKER,
    "### Preview deployment ready",
    "A fresh **Zephyr Cloud** preview is ready to review.",
    "",
    buildEnvironmentsTable(previewEnvironments, "active"),
    "",
    `<sub>${commit} · ${actionLabel} ${timestamp} · [Zephyr Cloud](${ZEPHYR_WEBSITE_URL})</sub>`,
  ].join("\n");
}
