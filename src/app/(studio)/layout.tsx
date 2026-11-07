import { Shell } from "@/components/shell";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/repo";
import { requireUser, uiLocale, uiTheme } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [locale, theme] = await Promise.all([uiLocale(), uiTheme()]);
  const projects = listProjects(getDb(), user.id).map((project) => ({ id: project.id, name: project.name }));
  return (
    <Shell locale={locale} theme={theme} userName={user.name} projects={projects}>
      {children}
    </Shell>
  );
}
