import { renderSimpleMarkdown } from "@/lib/markdown";

export function MarkdownView({ source }: { source: string }) {
  return <div className="prose-ll" dir="auto" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(source) }} />;
}
