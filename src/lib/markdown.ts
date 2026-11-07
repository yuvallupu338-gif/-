import { escapeHtml } from "@/lib/utils";

export function renderSimpleMarkdown(source: string) {
  const escaped = escapeHtml(source.trim());
  if (!escaped) return "";
  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      if (block.startsWith("# ")) return `<h2>${inline(block.slice(2))}</h2>`;
      if (block.startsWith("## ")) return `<h3>${inline(block.slice(3))}</h3>`;
      const lines = block.split("\n");
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>${lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map((line) => inline(line)).join("<br/>")}</p>`;
    })
    .join("");
}

function inline(value: string) {
  return value.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
