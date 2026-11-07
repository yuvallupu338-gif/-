"use client";

import { useEffect, useRef, useState } from "react";

export function useAutosave(signature: string, save: () => Promise<{ ok: boolean; error?: string }>) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const skip = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    setStatus("saving");
    const timer = setTimeout(async () => {
      const result = await saveRef.current();
      if (result.ok) {
        setStatus("saved");
        setError(null);
      } else {
        setStatus("error");
        setError(result.error ?? "");
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [signature]);

  return { status, error };
}
