import * as core from "@actions/core";
import * as github from "@actions/github";

import { createDeployment } from "./create-deployment";
import { createOrUpdateComment } from "./create-or-update-comment";
import { createPreviewEnvironment } from "./create-preview-environment";
import { validateEventContext } from "./validate-event-context";

async () => {
  console.log("Hello, world!");

  try {
    // Validate that this is a pull request and pull request data is available
    if (!validateEventContext()) {
      core.info(
        "This action can only be triggered on pull requests and pull request data must be available. Current event: " +
          github.context.eventName,
      );
      return;
    }

    // Create preview environment
    const previewUrl = createPreviewEnvironment();
    core.info(`Preview environment created: ${previewUrl}`);

    // Get GitHub token
    const githubToken = core.getInput("github_token");

    // Create deployment with GitHub token
    await createDeployment(githubToken, previewUrl);

    // Create or update comment
    await createOrUpdateComment(githubToken, previewUrl);

    // Set output
    core.setOutput("preview_url", previewUrl);
  } catch (error) {
    core.setFailed(
      `Action failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
