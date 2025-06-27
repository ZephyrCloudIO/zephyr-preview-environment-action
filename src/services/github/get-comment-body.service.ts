import * as github from "@actions/github";

export function getCommentBody(
  previewEnvironmentUrl: string,
  isPrClosed?: boolean,
): string {
  const { payload } = github.context;

  const branch = payload.pull_request?.head?.ref;
  const latestCommit = payload.pull_request?.head?.sha?.substring(0, 7);

  if (isPrClosed) {
    return `**Preview Environment Deactivated!**\n\n
  | Name | Status | URL |
  |--------|-----------|--------|
    | Preview | ❌ Deactivated | [${previewEnvironmentUrl}](${previewEnvironmentUrl}) |
  | Latest Version | ✅ Active | [${previewEnvironmentUrl}](${previewEnvironmentUrl}) |
  
  **Details:**
  - **Branch:** \`${branch}\`
  - **Latest Commit:** \`${latestCommit}\`
  - **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|--------|-----------|--------|
| 😎 Preview Environment | ✅ Active | [${previewEnvironmentUrl}](${previewEnvironmentUrl}) |
| 🔥 Version | ✅ Active | [${previewEnvironmentUrl}](${previewEnvironmentUrl}) |

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Created:** ${new Date().toLocaleString()}`;
}
