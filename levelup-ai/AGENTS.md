# levelup-ai

Agent SDK project (`@grok/agent-sdk`). The served agent's prompt is `bot/instructions.md`.

LEVEL UP AI is one orchestrator plus five specialists (`intake`, `designer`, `gamespec`, `reviewer`, `followup`). A game is a GameSpec JSON document. Deterministic checking lives in `bot/lib/validate-game-spec.ts`.

## Loop

```bash
npx @grok/agent-sdk validate --dir .
npx @grok/agent-sdk info --dir . --json
npx @grok/agent-sdk tool call validate_game_spec --dir . --input '{"spec":{}}'
npx @grok/agent-sdk eval --dir . --list
npm run check
```

Run the CLI under Node, never Bun.

## Layout

- `bot/instructions.md` — orchestrator. Keep routing and safety here.
- `bot/subagents/<id>/` — specialist prompts. Description is a routing rule.
- `bot/skills/*` — procedures loaded on demand. Full rule book: `master-prompt`.
- `bot/tools/<name>.ts` — one tool per file. Filename is the tool name.
- `bot/lib/` — shared code. Never discovered.
- `evals/` — filesystem evals (`evals/evals.config.ts` required).

## Do not

- Grow host TypeScript for formatting or reply composition.
- Add npm deps on a first cut. Stick to what `@grok/agent-sdk` already ships.
- Re-enable a shared memory journal. Creator material can be a child's notes.
- Point `serve` at a parent folder during bring-up.

## Pointers

- Master prompt: `docs/master-prompt.md`
- Package loop: `node_modules/@grok/agent-sdk/AGENTS.md`
