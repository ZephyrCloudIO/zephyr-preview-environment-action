// TODO: Implement Retry Pattern
export function createPreviewEnvironment(): string {
  try {
    const previewUrl = "https://preview.test.zephyr.com";

    return previewUrl;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Unknown error creating preview environment";
  }
}
