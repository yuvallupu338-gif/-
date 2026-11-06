import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BottomNav, type Tab } from "./components/BottomNav"
import { LessonScreen, type VictoryPayload } from "./components/LessonScreen"
import { Onboarding } from "./components/Onboarding"
import { PathScreen } from "./components/PathScreen"
import { ProfileScreen } from "./components/ProfileScreen"
import { ToolboxScreen } from "./components/ToolboxScreen"
import { TopBar } from "./components/TopBar"
import { VictoryScreen } from "./components/VictoryScreen"
import { useProgress } from "./context/ProgressContext"

type Screen = { name: Tab } | { name: "lesson"; lessonId: string } | { name: "victory"; payload: VictoryPayload }

export default function App() {
  const { state } = useProgress()
  const [screen, setScreen] = useState<Screen>({ name: "path" })

  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-gradient-to-b from-[#c8ecff] to-[#d9ffc8] sm:items-center sm:py-4">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-paper shadow-2xl sm:h-[min(900px,calc(100dvh-2rem))] sm:rounded-[32px] sm:border-4 sm:border-white">
        {!state.onboarded ? (
          <Onboarding />
        ) : (
          <>
            {screen.name !== "lesson" && screen.name !== "victory" && <TopBar />}
            <main className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={screen.name === "lesson" ? `lesson-${screen.lessonId}` : screen.name}
                  className={`h-full ${screen.name === "lesson" || screen.name === "victory" ? "overflow-hidden" : "overflow-y-auto"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {screen.name === "path" && <PathScreen onOpen={(lessonId) => setScreen({ name: "lesson", lessonId })} />}
                  {screen.name === "toolbox" && <ToolboxScreen />}
                  {screen.name === "profile" && <ProfileScreen />}
                  {screen.name === "lesson" && (
                    <LessonScreen
                      lessonId={screen.lessonId}
                      onExit={() => setScreen({ name: "path" })}
                      onVictory={(payload) => setScreen({ name: "victory", payload })}
                    />
                  )}
                  {screen.name === "victory" && (
                    <VictoryScreen {...screen.payload} onDone={() => setScreen({ name: "path" })} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
            {screen.name !== "lesson" && screen.name !== "victory" && (
              <BottomNav tab={screen.name} onChange={(name) => setScreen({ name })} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
