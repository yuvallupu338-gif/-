import { motion, useReducedMotion } from "framer-motion"

const colors = ["#58CC02", "#1CB0F6", "#FFC800", "#FF9600", "#CE82FF", "#FF4B4B"]

export function Confetti() {
  const reduce = useReducedMotion()
  if (reduce) return null

  const pieces = Array.from({ length: 56 }, (_, index) => {
    const left = (index * 13) % 100
    const delay = (index % 10) * 0.04
    const duration = 1.35 + (index % 5) * 0.16
    const rotate = (index % 2 === 0 ? 1 : -1) * (160 + (index % 6) * 30)
    const drift = (index % 2 === 0 ? 18 : -18)
    return { left, delay, duration, rotate, drift, color: colors[index % colors.length], size: 9 + (index % 4) * 3 }
  })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, index) => (
        <motion.span
          key={index}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * (index % 3 === 0 ? 1 : 0.45),
            background: piece.color,
            borderRadius: index % 3 === 0 ? 999 : 2,
          }}
          initial={{ y: -24, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 460, x: piece.drift, opacity: [1, 1, 0], rotate: piece.rotate }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  )
}
