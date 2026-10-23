import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "LEVEL UP AI",
  description:
    "Turns one learning goal, and optional study material, into a playable LEVEL UP GameSpec. Five specialists work together: intake, designer, gamespec, reviewer, followup.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
