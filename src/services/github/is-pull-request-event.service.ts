import * as github from "@actions/github";

export function isPullRequestEvent(): boolean {
  const { eventName, payload } = github.context;

  return eventName === "pull_request" && payload.pull_request !== undefined;
}
