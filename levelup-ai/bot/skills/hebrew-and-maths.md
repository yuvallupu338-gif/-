---
description: Use when any player-visible string is Hebrew (or Arabic), or when a challenge contains maths or code.
---

# Language, Hebrew and maths

Every player-visible string is in `meta.language`. Ids, keys and enums stay English ASCII.

Hebrew register: natural Israeli school Hebrew. Address the player in the **plural** everywhere, NPC lines included: בחרו, חשבו, סדרו, קראו, נסו, בדקו, ענו, שלכם, אתם. Never אתה / בחר / תבחר except inside a character's quoted speech.

Gender never gives an answer away: ״בידי מי נבנה…״, not ״מי בנתה…״. When feedback names a word, wrap it: המילה ״X״ לא מתאימה כאן.

Typography: prefix to a number/symbol/Latin word with maqaf ־ (מ־30, ב־10%, ו־false). Quote with gershayim ״…״ in Hebrew and “…” in English. Maths prose uses − × ÷; code keeps * - ==.

Maths is drawn left-to-right only inside: prompt, options, feedback, hint, explanation, sequence items, match sides, loreText. Keep each expression in one unbroken piece ("3x + 2y = 16", "1/3 = x/9").

Everywhere else (title, concept, NPC, mission, boss, area, lore title, station/portal labels, learning goal/objectives/conclusion) write **no** expression with a sign between numbers. Use words, a single number or a simple fraction such as 3/8.

Never write < > ≤ ≥ in Hebrew or Arabic prose. Write גדול מ־, קטן מ־, לפחות, לכל היותר. Allowed only inside one unbroken maths/code expression in a challenge or lore text.

A blank is **x**, never "?". Hebrew arrow chains use ← (עשב ← ארנב). Use → only inside Latin/code/chemistry or in English.

No LRM/RLM/bidi controls. No emoji. Line breaks (`\n`) are allowed.
