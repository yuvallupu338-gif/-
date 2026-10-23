import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { validateGameSpec } from "../lib/validate-game-spec";

export default defineTool({
  description:
    "Check a GameSpec against LEVEL UP's schema, references, tier, mode, device, solvability, and completability. ok is true only when errors and warnings are both empty. Fix every issue and call again. Do not claim this is LEVEL UP's own validator; it checks the same rules, and LEVEL UP's validator has the final word.",
  effect: "read",
  inputSchema: z.object({
    spec: z.unknown(),
    tier: z.enum(["A", "B", "C"]),
    mode: z.enum(["FAST", "FULL", "EXTEND"]),
    device: z.enum(["phone", "desktop"]),
  }),
  execute({ spec, tier, mode, device }) {
    const report = validateGameSpec(spec, { tier, mode, device });
    return {
      ok: report.errors.length === 0 && report.warnings.length === 0,
      errors: report.errors,
      warnings: report.warnings,
    };
  },
});
