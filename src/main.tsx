import { Component, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { MotionConfig } from "framer-motion"
import "@fontsource/rubik/hebrew-400.css"
import "@fontsource/rubik/hebrew-500.css"
import "@fontsource/rubik/hebrew-700.css"
import "@fontsource/rubik/hebrew-800.css"
import "@fontsource/rubik/latin-400.css"
import "@fontsource/rubik/latin-500.css"
import "@fontsource/rubik/latin-700.css"
import "@fontsource/rubik/latin-800.css"
import App from "./App"
import { ProgressProvider } from "./context/ProgressContext"
import "./index.css"

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-dvh place-items-center p-6 text-center">
          <div>
            <p className="text-xl font-extrabold">משהו נתקע</p>
            <p className="mt-2 text-sm text-muted">רעננו את העמוד. ההתקדמות שנשמרה במכשיר לא נמחקת.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById("root")
if (!root) throw new Error("missing root")

createRoot(root).render(
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </MotionConfig>
  </ErrorBoundary>,
)
