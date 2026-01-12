/**
 * Normalizes a job name by converting to lowercase and replacing
 * special characters with hyphens
 */
function normalizeJobName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .substring(0, 100);
}

/**
 * Gets the current GitHub Actions job name from environment variables.
 * Falls back to "default" if not available.
 *
 * @returns Normalized job name
 */
export function getJobName(): string {
  const rawJobName = process.env.GITHUB_JOB || "default";

  if (!rawJobName.trim()) {
    return "default";
  }

  return normalizeJobName(rawJobName);
}
