import JSZip from "jszip";
import { NextResponse } from "next/server";
import { scenariosToCsv } from "@/lib/finance";
import { brandPdf, businessPlanPdf } from "@/lib/pdf";
import { getDb } from "@/lib/db";
import { getProject, notify, recordExport } from "@/lib/repo";
import { text } from "@/lib/consultant/shared";
import { calendarCsv, summaryMarkdown, websiteFiles } from "@/lib/website-html";
import { currentUser } from "@/server/session";

const KINDS = ["plan", "brand", "finance", "calendar", "website", "summary"] as const;
type Kind = (typeof KINDS)[number];

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new NextResponse("Forbidden", { status: 403 });
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id, kind } = await context.params;
  if (!KINDS.includes(kind as Kind)) return new NextResponse("Not found", { status: 404 });
  const bundle = getProject(getDb(), user.id, id);
  if (!bundle) return new NextResponse("Not found", { status: 404 });
  const filename = `launchlab-${kind}-${id.slice(0, 8)}`;
  const response = kind === "plan"
    ? file(await businessPlanPdf(bundle), "application/pdf", `${filename}.pdf`)
    : kind === "brand"
      ? file(await brandPdf(bundle), "application/pdf", `${filename}.pdf`)
      : kind === "finance"
        ? file(scenariosToCsv(bundle.scenarios), "text/csv; charset=utf-8", `${filename}.csv`)
        : kind === "calendar"
          ? file(calendarCsv(bundle), "text/csv; charset=utf-8", `${filename}.csv`)
          : kind === "summary"
            ? file(summaryMarkdown(bundle), "text/markdown; charset=utf-8", `${filename}.md`)
            : file(await websiteZip(bundle), "application/zip", `${filename}.zip`);
  const db = getDb();
  recordExport(db, user.id, id, kind);
  notify(db, {
    userId: user.id,
    projectId: id,
    title: text(bundle.profile.locale, "קובץ הוכן", "A file was prepared"),
    body: kind,
    href: `/app/projects/${id}/export`,
  });
  return response;
}

async function websiteZip(bundle: NonNullable<ReturnType<typeof getProject>>) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(websiteFiles(bundle))) zip.file(name, content);
  return zip.generateAsync({ type: "uint8array" });
}

function file(body: BodyInit | Uint8Array, type: string, filename: string) {
  const payload = body instanceof Uint8Array ? Buffer.from(body) : body;
  return new NextResponse(payload, {
    headers: {
      "content-type": type,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
