import type {
  PreviewDeploymentTarget,
  PreviewEnvironment,
} from "../../types/preview-environment";

function escapeTableLinkLabel(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("]", "\\]");
}

function buildTargetRows(
  projectName: string,
  type: "Environment" | "Tag",
  targets: PreviewDeploymentTarget[] | undefined
): string[] {
  return (targets ?? []).map(
    (target) =>
      `| ${escapeTableLinkLabel(projectName)} | ${type} | [${escapeTableLinkLabel(target.name)} ↗](${target.url}) |`
  );
}

export function buildVersionLink(
  previewEnvironment: PreviewEnvironment
): string {
  return `[Version ↗](${previewEnvironment.urls[0]})`;
}

export function buildDeploymentTargetsTable(
  previewEnvironments: PreviewEnvironment[]
): string | undefined {
  const rows = previewEnvironments.flatMap((previewEnvironment) => [
    ...buildTargetRows(
      previewEnvironment.projectName,
      "Environment",
      previewEnvironment.environmentUrls
    ),
    ...buildTargetRows(
      previewEnvironment.projectName,
      "Tag",
      previewEnvironment.tagUrls
    ),
  ]);

  if (rows.length === 0) {
    return undefined;
  }

  return `#### Affected deployment targets

| Application | Type | Target |
| :-- | :-- | :-- |
${rows.join("\n")}`;
}
