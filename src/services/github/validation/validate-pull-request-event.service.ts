import { context } from "@actions/github";

export function validatePullRequestEvent(): boolean {
  const { eventName, payload } = context;

  return eventName === "pull_request" && payload.pull_request !== undefined;
}
