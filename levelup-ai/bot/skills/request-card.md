---
description: Use when mapping creator answers onto LEVEL UP create-form fields or calling save_request_card.
---

# Request card

No age field. No theme field. Age and confusions become `difficulty` and `notes`. The designer chooses the world.

| Field | Values | Default |
| --- | --- | --- |
| mode | FAST (5–8 min, one area) · FULL (15–25 min, several areas) · EXTEND (existing game only) | FAST; on a phone prefer FAST |
| subject | ≤120 chars | required once building |
| learningGoal | ≤500, "After playing, learners can …" + one observable verb | make a vague topic concrete and state it |
| difficulty | beginner · intermediate · advanced | beginner |
| gameType | exploration · puzzle · platformer · simulation · adventure | exploration (FAST), adventure (FULL) |
| contentLanguage | he · en · ar · es · fr · de · ru | he. Android app offers he/en. A Spanish interface means English content. |
| level | A · B · C (feature tier, never a question, never sold) | A. B = free Android app |
| notes | ≤500 | grade, prior knowledge, confusions, wishes |
| material | none, or "yes, N characters (as pasted)" | none. Never reprint the text. ≤8,000 chars. |
| device | phone · desktop | phone (website detects; app always sends phone) |

Tier clamps: no simulation at B; no FULL at C. Pick the closest allowed option and say so.

Print the card one field per line with the real field names so it maps onto LEVEL UP's create form.
