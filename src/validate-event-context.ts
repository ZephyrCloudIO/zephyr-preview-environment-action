import * as github from "@actions/github";

export function validateEventContext(): boolean {
  return (
    github.context.eventName === "pull_request" &&
    github.context.payload.pull_request !== undefined
  );
}
