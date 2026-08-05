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
import { useState, useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import ClueScreen from "@/components/screens/ClueScreen";
import TaskScreen from "@/components/screens/TaskScreen";
import ControlRoom from "@/components/screens/ControlRoom";
import TaskComplete from "@/components/screens/TaskComplete";
import TryAgain from "@/components/screens/TryAgain";
import FinishScreen from "@/components/screens/FinishScreen";
import SplashScreen from "@/components/screens/SplashScreen";
import ScratchScreen from "@/components/screens/ScratchScreen";
import RegisterScreen from "@/components/screens/RegisterScreen";
import { trpc } from "@/lib/trpc";
import MissionTimer from "@/components/MissionTimer";

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
  const { state, dispatch } = useGame();
  const { currentScreen, currentStationIndex, isFinished } = state;
  const [gameStarted, setGameStarted] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(() => {
    const saved = localStorage.getItem("hamerutz_team_id");
    return saved ? parseInt(saved, 10) : null;
  });
  const [teamName, setTeamName] = useState<string>(() => localStorage.getItem("hamerutz_team_name") ?? "");
  const [showRegister, setShowRegister] = useState(false);

  const advanceStation = trpc.game.advanceStation.useMutation();
  const finishGame = trpc.game.finishGame.useMutation();
  const [missionStartedAt, setMissionStartedAt] = useState<Date | null>(null);
  const startStation = trpc.game.startStation.useMutation({
    onSuccess: (res) => setMissionStartedAt(new Date(res.startedAt)),
  });

  // Start (or resume) the station timing log whenever the team enters a station
  useEffect(() => {
    if (teamId && gameStarted && !isFinished) {
      startStation.mutate({ teamId, stationIndex: currentStationIndex });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, gameStarted, currentStationIndex, isFinished]);

  // Restore progress from the server after a refresh/crash — the DB is the
  // source of truth for which station the team is on.
  const restoredRef = useRef(false);
  const { data: teamData, error: teamError } = trpc.game.getTeam.useQuery(
    { teamId: teamId ?? 0 },
    { enabled: !!teamId, retry: false }
  );

  useEffect(() => {
    if (!teamData || restoredRef.current) return;
    restoredRef.current = true;
    if (teamData.isFinished || teamData.currentStationIndex > 0) {
      dispatch({
        type: "RESTORE_PROGRESS",
        index: teamData.currentStationIndex,
        finished: teamData.isFinished,
      });
      setGameStarted(true);
    }
  }, [teamData]);

  // If the team was deleted by the admin, forget it and re-register
  useEffect(() => {
    if (teamError?.data?.code === "NOT_FOUND") {
      localStorage.removeItem("hamerutz_team_id");
      localStorage.removeItem("hamerutz_team_name");
      setTeamId(null);
      setTeamName("");
    }
  }, [teamError]);

  // Unique key for AnimatePresence — changes on screen or station change
  const screenKey = `${currentStationIndex}-${currentScreen}`;

  // Sync station progress to DB when station changes
  useEffect(() => {
    if (teamId && gameStarted && currentStationIndex > 0) {
      advanceStation.mutate({ teamId, nextIndex: currentStationIndex });
    }
  }, [currentStationIndex]);

  // Sync finish to DB
  useEffect(() => {
    if (teamId && isFinished) {
      finishGame.mutate({ teamId });
    }
  }, [isFinished]);

  const handleRegistered = (id: number, name: string) => {
    setTeamId(id);
    setTeamName(name);
    localStorage.setItem("hamerutz_team_id", id.toString());
    localStorage.setItem("hamerutz_team_name", name);
    setShowRegister(false);
    setGameStarted(true);
  };

  // Show register screen before splash (if not already registered)
  if (showRegister) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="register" variants={screenVariants} initial="initial" animate="animate" exit="exit" transition={screenTransition} style={{ position: "fixed", inset: 0 }}>
          <RegisterScreen onRegistered={handleRegistered} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show register screen FIRST if no team registered yet (before splash)
  if (!teamId && !gameStarted) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="register" variants={screenVariants} initial="initial" animate="animate" exit="exit" transition={screenTransition} style={{ position: "fixed", inset: 0 }}>
          <RegisterScreen onRegistered={handleRegistered} />
        </motion.div>
      </AnimatePresence>
    );
  }

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
          <SplashScreen onStart={() => {
            if (!teamId) {
              setShowRegister(true);
            } else {
              setGameStarted(true);
            }
          }} />
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
    <>
      {missionStartedAt && currentScreen !== "COMPLETE" && (
        <MissionTimer startedAt={missionStartedAt} />
      )}
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
        {currentScreen === "SCRATCH" && <ScratchScreen />}
        {currentScreen === "CLUE" && <ClueScreen />}
        {currentScreen === "TASK" && <TaskScreen />}
        {currentScreen === "CONTROL_ROOM" && <ControlRoom />}
        {currentScreen === "COMPLETE" && <TaskComplete />}
        {currentScreen === "TRY_AGAIN" && <TryAgain />}
      </motion.div>
    </AnimatePresence>
    </>
  );
}
