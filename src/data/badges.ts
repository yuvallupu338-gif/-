import { worlds } from "./lessons"
import { effectiveStreak, type ProgressState } from "../lib/progress"

export type BadgeIcon =
  | "sprout"
  | "spark"
  | "wallet"
  | "home"
  | "shield"
  | "gem"
  | "clipboard"
  | "book"
  | "flame"
  | "trophy"

export type Badge = {
  id: string
  name: string
  description: string
  icon: BadgeIcon
  test: (state: ProgressState) => boolean
}

const worldComplete = (worldId: string, state: ProgressState) => {
  const world = worlds.find((item) => item.id === worldId)
  return Boolean(world?.lessons.every((lesson) => state.completed[lesson.id]))
}

export const badges: Badge[] = [
  {
    id: "first-step",
    name: "צעד ראשון",
    description: "מסיימים שיעור אחד במסלול",
    icon: "sprout",
    test: (state) => Object.keys(state.completed).length >= 1,
  },
  {
    id: "perfect",
    name: "בלי מוקשים",
    description: "מסיימים שיעור בלי אף טעות",
    icon: "spark",
    test: (state) => Object.values(state.completed).some((lesson) => lesson.perfect),
  },
  {
    id: "money-world",
    name: "קוראים תלוש",
    description: "מסיימים את עולם הכסף ותלוש השכר",
    icon: "wallet",
    test: (state) => worldComplete("money", state),
  },
  {
    id: "rent-world",
    name: "עיניים פקוחות",
    description: "מסיימים את עולם השכירות והדיור",
    icon: "home",
    test: (state) => worldComplete("rent", state),
  },
  {
    id: "civic-world",
    name: "לא מפחדים מטפסים",
    description: "מסיימים את עולם הביטוח הלאומי והמסים",
    icon: "shield",
    test: (state) => worldComplete("civic", state),
  },
  {
    id: "diamonds",
    name: "קופה קטנה",
    description: "צוברים 50 יהלומים",
    icon: "gem",
    test: (state) => state.diamonds >= 50,
  },
  {
    id: "checklist",
    name: "סיור רציני",
    description: "מסמנים 8 פריטים בצ׳ק-ליסט הדירה",
    icon: "clipboard",
    test: (state) => Object.values(state.checklist).filter(Boolean).length >= 8,
  },
  {
    id: "glossary",
    name: "מילון בכיס",
    description: "פותחים 8 מושגים במילון",
    icon: "book",
    test: (state) => state.glossarySeen.length >= 8,
  },
  {
    id: "streak",
    name: "שלושה ימים",
    description: "משלימים שיעור בשלושה ימים רצופים",
    icon: "flame",
    test: (state) => effectiveStreak(state) >= 3,
  },
  {
    id: "all",
    name: "בוגרים על מלא",
    description: "מסיימים את כל תשעת השלבים",
    icon: "trophy",
    test: (state) => worlds.every((world) => worldComplete(world.id, state)),
  },
]

export function earnedBadges(state: ProgressState) {
  return badges.filter((badge) => badge.test(state))
}
