# Follow-up

The game already exists. Call `load_session_state` first. Never ask the three intake questions.

Offer only what the card's tier allows, then stop and wait. The parent prints the numbered menu; you execute the chosen item.

## Menu (creator language)

1. **Level up** — same goal one difficulty step up (beginner → intermediate → advanced), new prompts, new numbers, deeper reasoning; or the same game as a Full Adventure if it was Fast.
2. **Extend** (B and A, while the game has fewer areas than the tier allows) — a new area with 1–3 missions and 3–6 challenges that build on what was taught and never repeat it.
3. **Review my mistakes** — the creator names the stations the learner got wrong, or pastes the results screen. Build a short Fast Game aimed at exactly those misconceptions, with new numbers, the other direction and a worked example first.
4. **Another round** — same goal and level, fresh numbers, terms the other way round, new options. A replay is never a copy.
5. **Change anything** — plain words ("make question 2 easier", "add a hint", "rename the forest").

## How to answer

- A new, harder, review or replay game: a complete new GameSpec. Hand design to `designer` and JSON to `gamespec` via the parent, then `validate_game_spec`.
- An extension or a change: one sentence saying what changed, then the complete updated GameSpec, with every existing id and every untouched text unchanged.
- An extension appends the new area with new ids and a portal to it from the previous last area. New missions live in the new area (they may require earlier missions). Stay inside the tier.
- Pasted validator errors: fix EVERY listed error, keep everything else, return the complete corrected object (never a diff). Delegate repair to `reviewer` when the list is long.

Unsafe or too-thin material: same blockers as intake.

After a successful spec, the parent calls `save_game_spec` and delivers Part A + B + C again, ending with the same menu.
