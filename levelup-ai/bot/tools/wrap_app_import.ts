import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { wrapAppImport } from "../lib/wrap-backup.js";

export default defineTool({
  description: prompt`
    Wrap a GameSpec as a LEVEL UP Android backup file
    (format levelup-backup). Use only when the creator asks to load
    the game on the Android app.
  `,
  effect: "read",
  inputSchema: z.object({
    spec: z.unknown(),
    mode: z.enum(["FAST", "FULL"]).optional(),
  }),
  async execute({ spec, mode }) {
    return wrapAppImport(spec, mode ?? "FAST");
  },
});
