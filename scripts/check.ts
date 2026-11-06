import { lessons, questionCorrectId, worlds } from "../src/data/lessons.ts"
import { glossary } from "../src/data/glossary.ts"
import { checklistItems } from "../src/data/checklist.ts"
import { calculatePay } from "../src/lib/tax.ts"
import { applyLesson, effectiveStreak, freshState, loseHeart, refillHearts } from "../src/lib/progress.ts"

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

const sample = calculatePay({ gross: 12000, points: 2.25, studyFund: false })
assert(sample.incomeTax === 734, `income tax ${sample.incomeTax}`)
assert(sample.nationalInsurance === 381, `ni ${sample.nationalInsurance}`)
assert(sample.health === 471, `health ${sample.health}`)
assert(sample.pension === 720, `pension ${sample.pension}`)
assert(sample.net === 9694, `net ${sample.net}`)
assert(sample.slices.reduce((sum, slice) => sum + slice.amount, 0) === 12000, "slices do not sum to gross")

assert(worlds.length === 3, "expected 3 worlds")
assert(lessons.length === 9, "expected 9 lessons")
for (const lesson of lessons) {
  assert(lesson.questions.length === 4, `${lesson.id} should have 4 questions`)
  for (const question of lesson.questions) {
    const correct = questionCorrectId(question)
    if (question.type === "mc") assert(question.options.some((option) => option.id === correct), lesson.id)
    if (question.type === "mine") assert(question.lines.some((line) => line.id === correct), lesson.id)
    assert(question.explanation.length > 40, `${question.id} explanation too short`)
  }
}
assert(glossary.length >= 16, "glossary")
assert(checklistItems.length === 12, "checklist")

let state = freshState("2026-11-01")
assert(state.diamonds === 30 && state.hearts === 5, "welcome economy")
const first = applyLesson(state, { lessonId: "payslip", correct: 4, total: 4, practice: false }, "2026-11-01")
assert(first.reward.xpGained === 75, `xp ${first.reward.xpGained}`)
assert(first.reward.diamondsGained === 25, `diamonds ${first.reward.diamondsGained}`)
assert(first.state.streak === 1, "streak day 1")
state = applyLesson(first.state, { lessonId: "tax-points", correct: 3, total: 4, practice: false }, "2026-11-02").state
assert(state.streak === 2, "streak continues")
state = applyLesson(state, { lessonId: "pension", correct: 4, total: 4, practice: false }, "2026-11-05").state
assert(state.streak === 1, "streak resets after a gap")
assert(effectiveStreak(state, "2026-11-07") === 0, "broken streak display")

const replay = applyLesson(state, { lessonId: "payslip", correct: 4, total: 4, practice: true }, "2026-11-05")
assert(replay.reward.diamondsGained === 0 && replay.reward.xpGained === 20, "practice reward")

let broke = freshState("2026-11-01")
for (let index = 0; index < 5; index += 1) broke = loseHeart(broke)
assert(broke.hearts === 0, "hearts floor")
const refilled = refillHearts(broke)
assert(refilled?.hearts === 5 && refilled.diamonds === 0, "refill")
assert(refillHearts(refilled) === null, "no refill when full")

console.log("checks ok")
