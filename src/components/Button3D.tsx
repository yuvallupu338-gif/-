import type { ButtonHTMLAttributes } from "react"
import { cn } from "../lib/format"

const tones = {
  green: "bg-duo-green text-white border-duo-green-dark",
  blue: "bg-duo-blue text-white border-duo-blue-dark",
  red: "bg-duo-red text-white border-duo-red-dark",
  yellow: "bg-duo-yellow text-ink border-duo-yellow-dark",
  white: "bg-white text-ink border-line",
  purple: "bg-duo-purple text-white border-duo-purple-dark",
}

type Button3DProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: keyof typeof tones
  full?: boolean
}

export function Button3D({
  tone = "green",
  full,
  className,
  disabled,
  type = "button",
  children,
  ...props
}: Button3DProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "rounded-2xl border-2 border-b-4 px-4 py-3 text-base font-extrabold transition-transform",
        "active:translate-y-1 active:border-b-0",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-duo-blue",
        full && "w-full",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
