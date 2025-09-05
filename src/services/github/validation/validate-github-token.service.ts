import { getInput } from "@actions/core";
import { getOctokit } from "@actions/github";

export async function validateGitHubToken(): Promise<void> {
  const token = getInput("github_token", { required: true });

  if (!token || token.trim() === "") {
    throw new Error("GitHub token is required but not provided");
  }

  try {
    const octokit = getOctokit(token);

    // Validate token is valid by checking authentication
    await octokit.rest.users.getAuthenticated();

    // Check token scopes using rate limit API
    const { headers } = await octokit.rest.rateLimit.get();
    const scopes = headers["x-oauth-scopes"]?.toString().split(", ") || [];

    // Check if token has necessary scopes for the required permissions
    // (deployments:write, pull-requests:write, contents:read)
    const requiredScopes = ["repo", "public_repo"];
    const hasRequiredScope = requiredScopes.some((scope) =>
      scopes.includes(scope)
    );

    if (!hasRequiredScope) {
      throw new Error(
        `GitHub token lacks required scopes. Current scopes: ${scopes.join(", ")}. Required: 'repo' (for private repositories) or 'public_repo' (for public repositories) to enable deployments:write, pull-requests:write, and contents:read permissions.`
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("GitHub token lacks")
    ) {
      throw error;
    }

    throw new Error(
      `Invalid GitHub token provided: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
