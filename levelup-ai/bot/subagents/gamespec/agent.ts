import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  description:
    "Compile a complete LEVEL UP GameSpec JSON from a request card and a silent design. Use after designer. Return only valid JSON, no prose.",
});
