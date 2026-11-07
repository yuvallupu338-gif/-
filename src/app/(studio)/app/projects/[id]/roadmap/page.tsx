import { RoadmapStudio } from "@/components/roadmap-studio";
import { loadOwnedProject } from "@/server/load";

export default async function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <RoadmapStudio bundle={bundle} />;
}
