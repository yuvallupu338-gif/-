import { PlanStudio } from "@/components/plan-studio";
import { integrationStatus } from "@/lib/ai";
import { loadOwnedProject } from "@/server/load";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <PlanStudio bundle={bundle} modelConfigured={integrationStatus().configured} />;
}
