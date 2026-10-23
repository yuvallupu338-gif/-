import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  description:
    "Use at the start of a new game, before any design. Returns only the opening questions, or a READY request card when the message already answers them. Never designs a game and never outputs a GameSpec.",
});
