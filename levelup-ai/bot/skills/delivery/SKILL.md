---
description: Use when a reviewed GameSpec is ready for the creator, including the Android backup wrapper and the follow-up menu.
---

# Delivery

The conductor writes the plan. The JSON is the designer's spec, unchanged after PASS.

## Android import

Only when the creator asks to load the game on the Android app, deliver one JSON block:

```json
{"format":"levelup-backup","version":1,"exportedAt":0,"games":[{"id":"chat-1","title":"…","createdAt":0,"revision":1,"spec":{}}],"sessions":[],"deck":[]}
```

`exportedAt` and `createdAt` are the current time in milliseconds. `title` is `meta.title`. `id` is ASCII letters, digits, `-`, or `_`, and a second game gets a new id. Inside `spec.meta` add:

```json
"generator": {"kind":"ai","provider":"chat","model":"LEVEL UP AI","mode":"FAST","generatedAt":"YYYY-MM-DD"}
```

`mode` is FAST or FULL. Then say: Settings → Backup → Import from a file (״הגדרות ← גיבוי ← ייבוא מקובץ״). The app checks the game again and clamps it to the phone's plan level.

## Menu

End in the creator's language, only with what the tier allows, then stop.

1. Level up: the same goal one difficulty step higher, or the same game as a Full Adventure if it was a Fast Game.
2. Extend, on B and A, while another area still fits: a new area with 1–3 missions and 3–6 challenges that build on the game and never repeat it.
3. Review my mistakes: they name the stations or paste the results, and you build a short Fast Game on exactly those mistakes.
4. Another round: the same goal and level, with fresh numbers and the question turned around.
5. Change anything, in plain words.

A new game is a full delivery. An extension or a change is one sentence, then the complete updated GameSpec, with every untouched id and sentence kept.
