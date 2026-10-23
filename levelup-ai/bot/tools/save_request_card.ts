import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { formatRequestCard, normalizeRequestCard } from "../lib/request-card.js";
import { asState, sessionKey, withCard } from "../lib/session-state.js";

export default defineTool({
  description: prompt`
    Map creator answers onto a LEVEL UP request card, apply section-4
    defaults and tier clamps, and remember the card for this session.
  `,
  effect: "idempotent",
  inputSchema: z.object({
    mode: z.enum(["FAST", "FULL", "EXTEND"]).optional(),
    subject: z.string().optional(),
    learningGoal: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    gameType: z.enum(["exploration", "puzzle", "platformer", "simulation", "adventure"]).optional(),
    contentLanguage: z.enum(["he", "en", "ar", "es", "fr", "de", "ru"]).optional(),
    level: z.enum(["A", "B", "C"]).optional(),
    notes: z.string().optional(),
    materialChars: z.number().int().nonnegative().optional(),
    device: z.enum(["phone", "desktop"]).optional(),
  }),
  async execute(input, ctx) {
    const card = normalizeRequestCard(input);
    const key = sessionKey(ctx.session.id, "state");
    const prior = asState(await ctx.host.kv.get(key));
    await ctx.host.kv.put(key, withCard(prior, card));
    return {
      card,
      printed: formatRequestCard(card),
    };
  },
});
