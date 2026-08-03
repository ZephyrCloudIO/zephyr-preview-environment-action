import type { PreviewEnvironment } from "../../types/preview-environment";

function escapeTableLinkLabel(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("]", "\\]");
}

function buildTargetLinks(
  label: string,
  targets: PreviewEnvironment["environmentUrls"]
): string | undefined {
  if (!targets?.length) {
    return undefined;
  }

  const links = targets
    .map((target) => `[${escapeTableLinkLabel(target.name)} ↗](${target.url})`)
    .join(", ");
  return `${label}: ${links}`;
}

export function buildPreviewLinks(
  previewEnvironment: PreviewEnvironment
): string {
  const previewUrl = previewEnvironment.urls[0];
  return [
    `[Version ↗](${previewUrl})`,
    buildTargetLinks("Environments", previewEnvironment.environmentUrls),
    buildTargetLinks("Tags", previewEnvironment.tagUrls),
  ]
    .filter(Boolean)
    .join("<br>");
}
