# LEVEL UP AI

All five LEVEL UP specialists in one Agent SDK agent. The orchestrator talks to the creator; intake, designer, gamespec, reviewer and followup work together behind it.

A game is one JSON **GameSpec**. This project never writes executable game code.

## Specialists

| Agent | Job |
| --- | --- |
| **LEVEL UP AI** (root) | Conversation, language, safety, delivery |
| `intake` | Up to three questions, then a request card |
| `designer` | Objectives, misconceptions, world, route |
| `gamespec` | The complete GameSpec JSON |
| `reviewer` | Silent self-check + local `validate_game_spec` |
| `followup` | Level up, extend, review mistakes, another round, edits |

## Tools

- `save_request_card` / `load_session_state` — per-session card and spec
- `validate_game_spec` — local twin of LEVEL UP's checker
- `save_game_spec` — store a passing spec
- `wrap_app_import` — Android backup wrapper, only when asked

The local checker is not LEVEL UP's product validator. The product still has the final word.

## Run

```bash
cd levelup-ai
npx @grok/agent-sdk validate --dir .
npx @grok/agent-sdk info --dir . --json
npx @grok/agent-sdk tool call validate_game_spec --dir . --input '{"spec":{}}'
npm run check
npx @grok/agent-sdk login   # for model turns
npx @grok/agent-sdk dev
```

Playground: `http://127.0.0.1:3000/playground`

## Check

`npm run check` typechecks and runs the validator selftest against the verified Hebrew fractions example (0 errors, 0 warnings).

## Source

The master system prompt is in `docs/master-prompt.md` and is also loadable as the `master-prompt` skill.
