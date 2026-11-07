import { ExportPanel } from "@/components/export-panel";
import { getDb } from "@/lib/db";
import { listExports } from "@/lib/repo";
import { loadOwnedProject } from "@/server/load";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, bundle } = await loadOwnedProject(id);
  const exportsList = listExports(getDb(), user.id, id);
  return <ExportPanel bundle={bundle} exportsList={exportsList} />;
}
