"use client";

import { useRouter } from "next/navigation";
import { markReadAction } from "@/server/actions";

export function MarkRead({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-muted underline-offset-4 hover:underline"
      onClick={async () => {
        await markReadAction(id);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
