import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  description:
    "Silent self-check and repair of a GameSpec against LEVEL UP rules and validate_game_spec issues. Use after gamespec, and whenever the creator pastes validator errors.",
});
