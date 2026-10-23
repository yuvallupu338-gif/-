import { defineEval, includes, satisfies } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke", "intake"],
  cases: [
    {
      id: "asks-three-questions",
      description: "A topic-only Hebrew message must get the three intake questions and no GameSpec.",
      async test(t) {
        await t.send("אני רוצה משחק על שברים");
        t.succeeded();
        t.notCalledTool("validate_game_spec");
        t.notCalledTool("save_game_spec");
        t.check(t.reply, includes(/לפני שאני בונה/));
        t.check(t.reply, includes(/מי ישחק/));
        t.check(t.reply, includes(/מה הדבר האחד/));
        t.check(t.reply, includes(/איך המשחק ירגיש/));
        t.check(
          t.reply,
          satisfies((text) => typeof text === "string" && !text.includes("```json"), "no GameSpec JSON yet"),
        );
      },
    },
  ],
});
