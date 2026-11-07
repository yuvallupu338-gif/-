import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/repo";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string; file: string }> }) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { projectId, file } = await context.params;
  if (!/^[\w-]+\.png$/.test(file)) return new NextResponse("Not found", { status: 404 });
  if (!getProject(getDb(), user.id, projectId)) return new NextResponse("Not found", { status: 404 });
  const full = path.join(process.cwd(), "data", "media", projectId, file);
  if (!full.startsWith(path.join(process.cwd(), "data", "media"))) return new NextResponse("Not found", { status: 404 });
  if (!fs.existsSync(full)) return new NextResponse("Not found", { status: 404 });
  const bytes = fs.readFileSync(full);
  return new NextResponse(bytes, { headers: { "content-type": "image/png", "cache-control": "private, no-store" } });
}
