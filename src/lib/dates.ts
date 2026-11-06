export function jerusalemDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function previousDay(day: string) {
  const [year, month, date] = day.split("-").map(Number)
  const utc = new Date(Date.UTC(year, month - 1, date))
  utc.setUTCDate(utc.getUTCDate() - 1)
  return utc.toISOString().slice(0, 10)
}
