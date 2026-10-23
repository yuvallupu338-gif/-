import { asJson, type Json } from "./types.js";

type GameSpecLike = {
  meta?: { title?: unknown; generator?: unknown };
};

export type AppImportBackup = {
  format: "levelup-backup";
  version: 1;
  exportedAt: number;
  games: Array<{
    id: string;
    title: string;
    createdAt: number;
    revision: number;
    spec: Json;
  }>;
  sessions: [];
  deck: [];
};

export function wrapAppImport(spec: unknown, mode: "FAST" | "FULL" = "FAST"): AppImportBackup {
  const now = Date.now();
  const title =
    spec && typeof spec === "object" && "meta" in spec
      ? String((spec as GameSpecLike).meta?.title ?? "LEVEL UP game")
      : "LEVEL UP game";
  const slug = title
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "game";
  const wrappedSpec =
    spec && typeof spec === "object"
      ? {
          ...(spec as Record<string, unknown>),
          meta: {
            ...((spec as GameSpecLike).meta ?? {}),
            generator: {
              kind: "ai",
              provider: "chat",
              model: "LEVEL UP AI",
              mode,
              generatedAt: new Date(now).toISOString(),
            },
          },
        }
      : spec;
  return {
    format: "levelup-backup",
    version: 1,
    exportedAt: now,
    games: [
      {
        id: `chat-${slug}-${now.toString(36)}`,
        title,
        createdAt: now,
        revision: 1,
        spec: asJson(wrappedSpec),
      },
    ],
    sessions: [],
    deck: [],
  };
}
