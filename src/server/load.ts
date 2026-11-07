import "server-only";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/repo";
import { requireUser, uiLocale } from "@/server/session";

export async function loadOwnedProject(id: string) {
  const user = await requireUser();
  const locale = await uiLocale();
  const bundle = getProject(getDb(), user.id, id);
  if (!bundle) notFound();
  return { user, locale, bundle };
}
