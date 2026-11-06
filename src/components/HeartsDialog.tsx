import { Heart } from "lucide-react"
import { ECONOMY } from "../lib/progress"
import { useProgress } from "../context/ProgressContext"
import { Button3D } from "./Button3D"

export function HeartsDialog({
  open,
  onClose,
  onRefilled,
}: {
  open: boolean
  onClose: () => void
  onRefilled?: () => void
}) {
  const { state, refillHearts } = useProgress()
  if (!open) return null

  const full = state.hearts >= ECONOMY.maxHearts
  const canPay = state.diamonds >= ECONOMY.refillCost

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/40 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hearts-title"
        className="w-full rounded-3xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex justify-center gap-1">
          {Array.from({ length: ECONOMY.maxHearts }, (_, index) => (
            <Heart
              key={index}
              className={index < state.hearts ? "fill-duo-red text-duo-red" : "text-line"}
              aria-hidden="true"
            />
          ))}
        </div>
        <h2 id="hearts-title" className="text-center text-xl font-extrabold">
          {full ? "הלבבות מלאים" : `נשארו ${state.hearts} לבבות`}
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-muted">
          טעות בשיעור חדש מורידה לב. הלבבות מתמלאים מחר, או עכשיו ב-{ECONOMY.refillCost} יהלומים. יש לכם{" "}
          <span dir="ltr">{state.diamonds}</span> יהלומים.
        </p>
        <div className="mt-4 grid gap-3">
          {!full && (
            <Button3D
              tone="red"
              full
              disabled={!canPay}
              onClick={() => {
                if (refillHearts()) onRefilled?.()
                onClose()
              }}
            >
              {canPay ? `מילוי ל-5 ב-${ECONOMY.refillCost} יהלומים` : "אין מספיק יהלומים למילוי"}
            </Button3D>
          )}
          <Button3D tone="white" full onClick={onClose}>
            סגור
          </Button3D>
        </div>
      </div>
    </div>
  )
}
