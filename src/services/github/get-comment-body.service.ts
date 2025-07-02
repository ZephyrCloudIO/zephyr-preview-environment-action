import * as github from "@actions/github";

export function getCommentBody(
  previewEnvironmentUrls: string[],
  isPrClosed?: boolean,
): string {
  const { payload } = github.context;

  const branch = payload.pull_request?.head?.ref;
  const latestCommit = payload.pull_request?.head?.sha?.substring(0, 7);

  if (isPrClosed) {
    return `**Preview Environment Deactivated!**\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironmentUrls.map((url) => `| Preview | ❌ Deactivated | [${url}](${url}) |`).join("\n")}
| Latest Version | ✅ Active | [${previewEnvironmentUrls[0]}](${previewEnvironmentUrls[0]}) |

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Deactivated:** ${new Date().toLocaleString()}`;
  }

  return `🚀 **Preview Environment Ready!**\n\n
| Name | Status | URL |
|----|----------|--------|
${previewEnvironmentUrls.map((url) => `| 😎 Preview Environment | ✅ Active | [${url}](${url}) |`).join("\n")}
| 🔥 Version | ✅ Active | [${previewEnvironmentUrls[0]}](${previewEnvironmentUrls[0]}) |

**Details:**
- **Branch:** \`${branch}\`
- **Latest Commit:** \`${latestCommit}\`
- **Created:** ${new Date().toLocaleString()}`;
}
