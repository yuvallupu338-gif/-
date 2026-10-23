import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  description:
    "Use after the designer returns a GameSpec, and when the creator pastes a spec to check. Calls validateGameSpec, runs the content bar, and returns PASS or FAIL. Never designs a replacement game.",
});
