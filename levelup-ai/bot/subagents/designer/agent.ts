import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  description:
    "Use after a READY request card, or when a GameSpec came back with validator issues. Designs one GameSpec, calls validateGameSpec, and returns the spec only when ok is true. Never speaks to the creator.",
});
