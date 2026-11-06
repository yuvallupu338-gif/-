export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export function shekel(value: number, digits = 0) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function integer(value: number) {
  return new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 }).format(value)
}

export function pointsLabel(value: number) {
  return value.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
