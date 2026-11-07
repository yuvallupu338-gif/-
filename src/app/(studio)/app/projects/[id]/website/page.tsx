import { WebsiteStudio } from "@/components/website-studio";
import { integrationStatus } from "@/lib/ai";
import { loadOwnedProject } from "@/server/load";

export default async function WebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <WebsiteStudio bundle={bundle} publishEnabled={integrationStatus().publishEnabled} />;
}
