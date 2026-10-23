import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { asState, sessionKey, withSpec } from "../lib/session-state.js";
import { validateGameSpec } from "../lib/validate-game-spec.js";

export default defineTool({
  description: prompt`
    Remember the GameSpec for this session after it passes validation.
    Re-runs the checker and refuses to store a spec with errors.
  `,
  effect: "idempotent",
  inputSchema: z.object({
    spec: z.unknown(),
    mode: z.enum(["FAST", "FULL"]).optional(),
    level: z.enum(["A", "B", "C"]).optional(),
    device: z.enum(["phone", "desktop"]).optional(),
  }),
  async execute({ spec, mode, level, device }, ctx) {
    const lastValidation = validateGameSpec(spec, { mode, level, device, chat: true });
    if (!lastValidation.ok) {
      return { stored: false, lastValidation };
    }
    const key = sessionKey(ctx.session.id, "state");
    const prior = asState(await ctx.host.kv.get(key));
    await ctx.host.kv.put(key, withSpec(prior, spec, lastValidation));
    return { stored: true, lastValidation };
  },
});
