import * as core from "@actions/core";

import { handlePullRequestOpened } from "./handlers/pull-request-opened.handler";

(async () => {
  try {
    // if (!isPullRequestEvent()) {
    //   core.warning(
    //     "This action can only be triggered on pull requests and pull request data must be available. Current event: " +
    //       github.context.eventName,
    //   );

    //   return;
    // }

    await handlePullRequestOpened();

    // const eventAction = github.context.payload.action;
    // switch (eventAction) {
    //   case "opened":
    //     await handlePullRequestOpened();
    //     break;
    //   case "synchronize":
    //   case "reopened":
    //     await handlePullRequestUpdated();
    //     break;
    //   case "closed":
    //     await handlePullRequestClosed();
    //     break;
    // }
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
  }
})();
