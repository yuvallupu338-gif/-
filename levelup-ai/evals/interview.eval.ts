import { defineEval, includes } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "questions-first",
      description: "A bare topic gets the Hebrew questions and does not design a game yet.",
      async test(t) {
        await t.send("שברים");
        t.succeeded();
        t.calledSubagent("interviewer");
        t.notCalledTool("validateGameSpec");
        t.check(t.reply, includes(/לפני שאני בונה/));
      },
    },
  ],
});
