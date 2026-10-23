---
description: Use when writing, editing or repairing GameSpec JSON (limits, ids, missions, portals, bosses, variants, program/simulation).
---

# GameSpec schema and validator rules

Ids: `^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$`. Unique per kind. Prefixes a1 s1 s-lore n1 m1 c1 o1 b1.

Always write: objectiveId, level, numeric tolerance, layout, size, hazardLevel, collectibles, timeOfDay, subjectCategory, estimatedMinutes.

Never write: age/grade, challenge difficulty, choice answer, correctOrder, images/audio/scores, meta.featureTier, meta.generator (except the app-import wrapper).

## Mode shape

FAST: 1 area, 3–6 challenge stations, no portal, 2–3 required missions, 4–10 minutes.
FULL: ≥2 areas (exactly 2 at B; in chat always 2), ≥4 missions, ≥8 placed challenges (chat 8–10), 12–30 minutes. Tier-A FULL includes its own boss.

## Placement

Every challenge on exactly one station, except variants (no station). Every placed challenge in a solve objective. Every lore station in a visit objective. Missions only reference their own area. requires backwards only, no cycles, nothing requires a side mission. Portal chain forward; last area has none.

Doors: station order is unlock order. Collect in the last mission of a rooms area.

Bosses (A): 2–5 phase stations, easiest first, one mission = solve phases + defeat. Variants (A): easierId for error-prone items; harderId only after the third challenge. FAST ≤2 variants.

## Program

Cells 0-based. x east, y south. allowed: move|turnLeft|turnRight|repeat|ifPathClear. solution: move|left|right|repeat|if. if = body when the cell ahead is free. Blocks count recursively ≤ maxBlocks. Nesting ≤ 3. ≤400 actions. Success = robot ENDS on the goal. Bump into a wall is not failure.

Verified: 4×4, start {0,0,E}, goal {3,3}, wall {0,1}, allowed [move, turnRight, repeat], maxBlocks 5, solution [repeat 3 move, right, repeat 3 move].

## Simulation

Projectile: maxSpeed² ÷ gravity + tolerance ≥ targetDistance. Verified: g 9.8, distance 40, tol 2, maxSpeed 30.
Lever: leftWeight × leftDistance ÷ rightWeight between 0.5 and maxDistance. Verified: 6, 2, 3, max 10, tol 0.25 balances at 4 m.
