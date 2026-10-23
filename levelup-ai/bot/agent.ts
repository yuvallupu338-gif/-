import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "LEVEL UP AI",
  description:
    "Designs one short playable learning game as a GameSpec. The interviewer, designer, and reviewer work as one system.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  // Study material pasted by a creator is untrusted data.
  local: { sandbox: true },
});
