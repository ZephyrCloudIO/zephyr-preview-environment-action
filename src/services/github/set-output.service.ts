import { setOutput as setGhOutput } from "@actions/core";
import type { PreviewEnvironment } from "../../types/preview-environment";

export function setOutput(previewEnvironments: PreviewEnvironment[]) {
  const envMap = Object.fromEntries(
    previewEnvironments.map((env) => [env.projectName, env])
  );
  setGhOutput("preview_environments_urls", JSON.stringify(envMap));
}
