import type { StarredRepo } from "../types";

export function exportMarkdown(projects: StarredRepo[]): string {
  const lines = [
    "# My Quiver - Pinned Self-Hosted Projects",
    "",
    `> Exported on ${new Date().toLocaleDateString()}`,
    "",
  ];

  for (const p of projects) {
    const homepage = p.homepage ? ` | [Website](${p.homepage})` : "";
    lines.push(`## [${p.fullName}](${p.url})${homepage}`);
    if (p.description) lines.push(`${p.description}`);
    if (p.language) lines.push(`- **Language:** ${p.language}`);
    lines.push(`- **Stars:** ${p.stars.toLocaleString()}`);
    if (p.topics.length > 0) lines.push(`- **Topics:** ${p.topics.join(", ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function exportJson(projects: StarredRepo[]): string {
  const data = projects.map((p) => ({
    name: p.fullName,
    description: p.description,
    url: p.url,
    homepage: p.homepage,
    stars: p.stars,
    language: p.language,
    topics: p.topics,
  }));
  return JSON.stringify(data, null, 2);
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
