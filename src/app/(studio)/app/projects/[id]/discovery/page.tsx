import { DiscoveryStudio } from "@/components/discovery-studio";
import { loadOwnedProject } from "@/server/load";

export default async function DiscoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <DiscoveryStudio bundle={bundle} />;
}
