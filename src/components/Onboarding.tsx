import { useState } from "react"
import { ECONOMY } from "../lib/progress"
import { useProgress } from "../context/ProgressContext"
import { Button3D } from "./Button3D"

export function Onboarding() {
  const { onboard } = useProgress()
  const [name, setName] = useState("")

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-8">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border-b-4 border-duo-green-dark bg-duo-green text-4xl font-extrabold text-white">
        ב
      </div>
      <h1 className="mt-4 text-center text-3xl font-extrabold">בוגרים</h1>
      <p className="mt-2 text-center text-base font-bold leading-7 text-muted">
        כישורי חיים לצעירים בישראל: תלוש שכר, שכירות, ביטוח לאומי ומסים. בלי שיעורי בית משעממים.
      </p>
      <ul className="mt-5 grid gap-2 text-sm font-bold">
        <li className="rounded-2xl bg-duo-green-soft px-3 py-2">כסף ותלוש שכר</li>
        <li className="rounded-2xl bg-duo-blue-soft px-3 py-2">שכירות ודיור</li>
        <li className="rounded-2xl bg-duo-purple-soft px-3 py-2">ביטוח לאומי ומסים</li>
      </ul>
      <label className="mt-5 block">
        <span className="text-sm font-extrabold">איך לפנות אליכם?</span>
        <input
          value={name}
          dir="rtl"
          maxLength={24}
          onChange={(event) => setName(event.target.value)}
          placeholder="אפשר גם בלי שם"
          className="mt-1 w-full rounded-2xl border-2 border-line bg-white px-4 py-3 font-bold outline-none focus:border-duo-blue"
        />
      </label>
      <p className="mt-3 text-xs leading-5 text-muted">
        יש חמישה לבבות. טעות בשיעור חדש מורידה אחד. מילוי עולה {ECONOMY.refillCost} יהלומים, וקיבלתם {ECONOMY.welcomeDiamonds} להתחלה. הכול נשמר במכשיר.
      </p>
      <Button3D className="mt-auto" full onClick={() => onboard(name)}>
        מתחילים
      </Button3D>
    </div>
  )
}
