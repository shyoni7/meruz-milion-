/**
 * HaMerutz L-70 — Game Page
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * The main game orchestrator. Uses AnimatePresence to transition
 * between screens with a cinematic slide + fade effect.
 *
 * Screen flow:
 * CLUE → TASK → CONTROL_ROOM → COMPLETE (→ next station) | TRY_AGAIN (→ CONTROL_ROOM)
 */

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import ClueScreen from "@/components/screens/ClueScreen";
import TaskScreen from "@/components/screens/TaskScreen";
import ControlRoom from "@/components/screens/ControlRoom";
import TaskComplete from "@/components/screens/TaskComplete";
import TryAgain from "@/components/screens/TryAgain";
import FinishScreen from "@/components/screens/FinishScreen";
import SplashScreen from "@/components/screens/SplashScreen";

// Screen transition variants — cinematic forward slide
const screenVariants = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
};

const screenTransition = {
  duration: 0.28,
  ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
};

export default function GamePage() {
  const { state } = useGame();
  const { currentScreen, currentStationIndex, isFinished } = state;
  const [gameStarted, setGameStarted] = useState(false);

  // Unique key for AnimatePresence — changes on screen or station change
  const screenKey = `${currentStationIndex}-${currentScreen}`;

  if (!gameStarted) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="splash"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={screenTransition}
          style={{ position: "fixed", inset: 0 }}
        >
          <SplashScreen onStart={() => setGameStarted(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isFinished) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="finish"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={screenTransition}
          style={{ position: "fixed", inset: 0 }}
        >
          <FinishScreen />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={screenTransition}
        style={{ position: "fixed", inset: 0 }}
      >
        {currentScreen === "CLUE" && <ClueScreen />}
        {currentScreen === "TASK" && <TaskScreen />}
        {currentScreen === "CONTROL_ROOM" && <ControlRoom />}
        {currentScreen === "COMPLETE" && <TaskComplete />}
        {currentScreen === "TRY_AGAIN" && <TryAgain />}
      </motion.div>
    </AnimatePresence>
  );
}
