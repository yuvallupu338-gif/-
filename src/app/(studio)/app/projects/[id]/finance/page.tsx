import { FinanceStudio } from "@/components/finance-studio";
import { loadOwnedProject } from "@/server/load";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <FinanceStudio bundle={bundle} />;
}
