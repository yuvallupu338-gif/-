import { MarketingStudio } from "@/components/marketing-studio";
import { loadOwnedProject } from "@/server/load";

export default async function MarketingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <MarketingStudio bundle={bundle} />;
}
