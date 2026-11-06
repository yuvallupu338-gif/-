import {
  BadgePercent,
  BookOpen,
  ClipboardCheck,
  FileWarning,
  Flame,
  Gem,
  Home,
  KeyRound,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  Shield,
  Sparkles,
  Sprout,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import type { BadgeIcon } from "../data/badges"
import type { LessonIcon } from "../data/lessons"

export const lessonIcons: Record<LessonIcon, LucideIcon> = {
  receipt: Receipt,
  percent: BadgePercent,
  piggy: PiggyBank,
  home: Home,
  file: FileWarning,
  key: KeyRound,
  shield: Shield,
  scale: Scale,
  landmark: Landmark,
}

export const badgeIcons: Record<BadgeIcon, LucideIcon> = {
  sprout: Sprout,
  spark: Sparkles,
  wallet: Wallet,
  home: Home,
  shield: Shield,
  gem: Gem,
  clipboard: ClipboardCheck,
  book: BookOpen,
  flame: Flame,
  trophy: Trophy,
}
