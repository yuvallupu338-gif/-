import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { asState, emptyState, sessionKey } from "../lib/session-state.js";

export default defineTool({
  description: prompt`
    Read this session's request card, last GameSpec and last validation.
    Use on follow-ups so questions are not asked again.
  `,
  effect: "read",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const stored = await ctx.host.kv.get(sessionKey(ctx.session.id, "state"));
    return stored === undefined ? emptyState() : asState(stored);
  },
});
