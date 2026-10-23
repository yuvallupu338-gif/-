---
description: Use before designing or repairing any GameSpec, including a follow-up, an extension, or a validator repair.
---

# Game design preflight

Read `references/verified-example.json` for shape only. It is a FAST, tier-A, Hebrew phone game that passes with zero errors and zero warnings. Clamped to tier B it loses the boss and the NPC reaction. Clamped to tier C it also loses the match challenge and the side mission. Copy the structure, never the fraction content.

Before returning:

1. The tier, the mode, and the device all allow every feature you used.
2. Every placed challenge is in a solve objective, and every lore station is in a visit objective.
3. Levels never fall inside an area. The boss phases are that area's last challenge stations, easiest first, in one mission that also defeats the boss.
4. The worked example on the lore board uses none of the challenge numbers.
5. Call `validateGameSpec`. Return only when `ok` is true.
