import { setFailed, warning } from "@actions/core";
import { context } from "@actions/github";

import { handlePullRequestClosed } from "./handlers/pull-request-closed.handler";
import { handlePullRequestOpened } from "./handlers/pull-request-opened.handler";
import { handlePullRequestUpdated } from "./handlers/pull-request-updated.handler";
import { validateGitHubToken } from "./services/github/validation/validate-github-token.service";
import { validatePullRequestEvent } from "./services/github/validation/validate-pull-request-event.service";
import { validateWorkflowPermissions } from "./services/github/validation/validate-workflow-permissions.service";

(async () => {
  try {
    if (!validatePullRequestEvent()) {
      warning(
        "This action can only be triggered on pull requests and pull request data must be available. Current event: " +
          context.eventName
      );

      return;
    }

    await validateGitHubToken();
    await validateWorkflowPermissions();

    const eventAction = context.payload.action;
    switch (eventAction) {
      case "opened":
        await handlePullRequestOpened();
        break;
      case "synchronize":
      case "reopened":
        await handlePullRequestUpdated();
        break;
      case "closed":
        await handlePullRequestClosed();
        break;
      default:
        throw new Error(`Unsupported event action: ${eventAction}`);
    }
  } catch (error) {
    setFailed(
      `Action failed: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`
    );
  }
})();
