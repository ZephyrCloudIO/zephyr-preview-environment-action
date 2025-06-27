import * as core from "@actions/core";
import * as github from "@actions/github";

import { handlePullRequestClosed } from "./handlers/pull-request-closed.handler";
import { handlePullRequestOpened } from "./handlers/pull-request-opened.handler";
import { handlePullRequestUpdated } from "./handlers/pull-request-updated.handler";
import { isPullRequestEvent } from "./services/github/is-pull-request-event.service";

(async () => {
  try {
    if (!isPullRequestEvent()) {
      core.warning(
        "This action can only be triggered on pull requests and pull request data must be available. Current event: " +
          github.context.eventName
      );

      return;
    }

    const prState = github.context.payload.pull_request?.state;
    core.info(`PR state: ${prState}`);
    core.setOutput("preview_environment_url", prState);

    switch (prState) {
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
    }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
})();
