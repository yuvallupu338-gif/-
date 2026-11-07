import { BrandStudio } from "@/components/brand-studio";
import { integrationStatus } from "@/lib/ai";
import { loadOwnedProject } from "@/server/load";

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bundle } = await loadOwnedProject(id);
  return <BrandStudio bundle={bundle} imageEnabled={integrationStatus().imageEnabled} />;
}
