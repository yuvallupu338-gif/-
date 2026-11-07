import { Overview } from "@/components/overview";
import { loadOwnedProject } from "@/server/load";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <Overview bundle={bundle} />;
}
