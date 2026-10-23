import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { validateGameSpec } from "../lib/validate-game-spec.js";

export default defineTool({
  description: prompt`
    Run LEVEL UP's GameSpec checker (schema, ids, placement, missions,
    portals, solvability, mode shape). Call this before delivering JSON.
    Never claim you ran LEVEL UP's product validator; this is the local twin.
  `,
  effect: "read",
  inputSchema: z.object({
    spec: z.unknown().describe("The complete GameSpec object"),
    mode: z.enum(["FAST", "FULL"]).optional(),
    level: z.enum(["A", "B", "C"]).optional(),
    device: z.enum(["phone", "desktop"]).optional(),
  }),
  async execute({ spec, mode, level, device }) {
    return validateGameSpec(spec, { mode, level, device, chat: true });
  },
});
