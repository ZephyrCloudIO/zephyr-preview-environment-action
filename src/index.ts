import { warning } from "@actions/core";
import { context } from "@actions/github";

import { handlePullRequestClosed } from "./handlers/pull-request-closed.handler";
import { handlePullRequestOpened } from "./handlers/pull-request-opened.handler";
import { handlePullRequestUpdated } from "./handlers/pull-request-updated.handler";
import { validatePullRequestEvent } from "./services/github/validation/validate-pull-request-event.service";
import { NO_DEPLOYED_APPS_MESSAGE } from "./services/zephyr/create-preview-environments.service";

(async () => {
  try {
    if (!validatePullRequestEvent()) {
      warning(
        "This action can only be triggered on pull requests and pull request data must be available. Current event: " +
          context.eventName
      );

      return;
    }

    const eventAction = context.payload.action;
    switch (eventAction) {
      case "opened":
        await handlePullRequestOpened();
        break;
      case "closed":
        await handlePullRequestClosed();
        break;
      default:
        await handlePullRequestUpdated();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);

    if (errorMessage === NO_DEPLOYED_APPS_MESSAGE) {
      warning(`Preview deployment skipped: ${errorMessage}`);

      return;
    }

    warning(`Action error (non-blocking): ${errorMessage}`);

    return;
  }
})();
