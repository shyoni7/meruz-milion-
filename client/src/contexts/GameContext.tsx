/**
 * HaMerutz L-70 — Game Context
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Manages the entire game state:
 * - Which station we're on
 * - Which screen is currently shown
 * - How many hints have been revealed
 * - Whether the game is finished
 *
 * Stations come from the database (admin panel). The hardcoded demo
 * stations are used only as a fallback while loading / when the DB is empty.
 */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  GameState,
  Station,
  initialGameState,
  stations as builtinStations,
} from "@/data/stations";
import { trpc } from "@/lib/trpc";

// ── Actions ──────────────────────────────────────────────────────────────────

type GameAction =
  | { type: "SCRATCH_REVEALED" }        // SCRATCH → CLUE
  | { type: "ADVANCE_SCREEN" }         // CLUE → TASK
  | { type: "GO_TO_CONTROL_ROOM" }     // TASK → CONTROL_ROOM
  | { type: "APPROVE_MISSION" }        // CONTROL_ROOM → COMPLETE
  | { type: "RETRY_MISSION" }          // CONTROL_ROOM → TRY_AGAIN
  | { type: "RETRY_PHOTO" }            // TRY_AGAIN → TASK (retake the photo)
  | { type: "NEXT_STATION"; totalStations: number } // COMPLETE → next CLUE (or finish)
  | { type: "REVEAL_HINT"; maxHints: number }       // reveal next hint
  | { type: "RESTORE_PROGRESS"; index: number; finished: boolean } // resume from DB
  | { type: "RESET_GAME" };            // restart from beginning

// ── Reducer ───────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SCRATCH_REVEALED": {
      // SCRATCH → CLUE
      return { ...state, currentScreen: "CLUE" };
    }

    case "ADVANCE_SCREEN": {
      // CLUE → TASK
      if (state.currentScreen === "CLUE") {
        return { ...state, currentScreen: "TASK", hintsRevealed: 0 };
      }
      return state;
    }

    case "GO_TO_CONTROL_ROOM": {
      // TASK → CONTROL_ROOM
      return { ...state, currentScreen: "CONTROL_ROOM" };
    }

    case "APPROVE_MISSION": {
      // CONTROL_ROOM → COMPLETE
      return { ...state, currentScreen: "COMPLETE" };
    }

    case "RETRY_MISSION": {
      // CONTROL_ROOM → TRY_AGAIN
      return { ...state, currentScreen: "TRY_AGAIN" };
    }

    case "RETRY_PHOTO": {
      // TRY_AGAIN → TASK so the team can actually take and send a new photo
      return { ...state, currentScreen: "TASK" };
    }

    case "NEXT_STATION": {
      // COMPLETE → next station's CLUE, or finish
      const nextIndex = state.currentStationIndex + 1;
      if (nextIndex >= action.totalStations) {
        return { ...state, isFinished: true };
      }
      return {
        ...state,
        currentStationIndex: nextIndex,
        currentScreen: "SCRATCH",
        hintsRevealed: 0,
      };
    }

    case "REVEAL_HINT": {
      if (state.hintsRevealed < action.maxHints) {
        return { ...state, hintsRevealed: state.hintsRevealed + 1 };
      }
      return state;
    }

    case "RESTORE_PROGRESS": {
      // Resume where the team left off (server is the source of truth)
      return {
        ...state,
        currentStationIndex: action.index,
        currentScreen: "SCRATCH",
        hintsRevealed: 0,
        isFinished: action.finished,
      };
    }

    case "RESET_GAME": {
      return { ...initialGameState };
    }

    default:
      return state;
  }
}

// ── DB → client station mapping ───────────────────────────────────────────────

type DbStation = {
  id: number;
  orderIndex: number;
  title: string;
  subtitle: string | null;
  clueText: string;
  clueImageUrl: string | null;
  taskTitle: string;
  taskDescription: string;
  taskImageUrl?: string | null;
  taskType?: string;
  taskAudioUrl?: string | null;
  taskAudioUrls?: string | null;
  skipScratch?: boolean;
  hint1: string | null;
  hint2: string | null;
  hint3: string | null;
  wazeUrl: string | null;
  funFact: string | null;
};

function parseAudioUrls(s: DbStation): string[] {
  try {
    const arr = s.taskAudioUrls ? (JSON.parse(s.taskAudioUrls) as string[]) : [];
    if (Array.isArray(arr) && arr.length > 0) return arr.filter(Boolean);
  } catch {
    // fall through to legacy single url
  }
  return s.taskAudioUrl ? [s.taskAudioUrl] : [];
}

function mapDbStation(s: DbStation, idx: number): Station {
  return {
    id: `station-${s.id}`,
    dbId: s.id,
    taskType: (s.taskType as Station["taskType"]) ?? "photo",
    taskImageUrl: s.taskImageUrl || undefined,
    taskAudioUrl: s.taskAudioUrl || undefined,
    audioUrls: parseAudioUrls(s),
    skipScratch: s.skipScratch ?? false,
    number: idx + 1,
    name: s.title,
    image: s.clueImageUrl ?? "",
    clue: {
      title: s.subtitle ? `${s.title} — ${s.subtitle}` : `תחנה ${idx + 1} — ${s.title}`,
      text: s.clueText,
    },
    task: {
      title: s.taskTitle,
      instructions: s.taskDescription,
      wazeLink: s.wazeUrl || undefined,
    },
    hints: [s.hint1, s.hint2, s.hint3].filter(
      (h): h is string => typeof h === "string" && h.trim().length > 0
    ),
    fact: s.funFact ?? "",
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  stations: Station[];
  currentStation: Station;
  stationsLoading: boolean;
  dispatch: React.Dispatch<GameAction>;
  // Convenience helpers
  scratchRevealed: () => void;
  advanceScreen: () => void;
  goToControlRoom: () => void;
  approveMission: () => void;
  retryMission: () => void;
  retryPhoto: () => void;
  nextStation: () => void;
  revealHint: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Load real stations from the database (admin panel). Refetch occasionally
  // so newly added stations appear without a full reload.
  const { data: dbStations, isLoading: stationsLoading } = trpc.game.getStations.useQuery(
    undefined,
    { staleTime: 30_000, refetchInterval: 60_000 }
  );

  const stations = useMemo<Station[]>(() => {
    if (dbStations && dbStations.length > 0) {
      return dbStations.map(mapDbStation);
    }
    return builtinStations;
  }, [dbStations]);

  // Clamp the index in case the station list shrank while playing
  const safeIndex = Math.min(state.currentStationIndex, stations.length - 1);
  const currentStation = stations[safeIndex];

  // Stations marked skipScratch jump straight to the clue screen
  useEffect(() => {
    if (state.currentScreen === "SCRATCH" && currentStation?.skipScratch) {
      dispatch({ type: "SCRATCH_REVEALED" });
    }
  }, [state.currentScreen, currentStation]);

  const value: GameContextValue = {
    state,
    stations,
    currentStation,
    stationsLoading,
    dispatch,
    scratchRevealed: () => dispatch({ type: "SCRATCH_REVEALED" }),
    advanceScreen: () => dispatch({ type: "ADVANCE_SCREEN" }),
    goToControlRoom: () => dispatch({ type: "GO_TO_CONTROL_ROOM" }),
    approveMission: () => dispatch({ type: "APPROVE_MISSION" }),
    retryMission: () => dispatch({ type: "RETRY_MISSION" }),
    retryPhoto: () => dispatch({ type: "RETRY_PHOTO" }),
    nextStation: () => dispatch({ type: "NEXT_STATION", totalStations: stations.length }),
    revealHint: () =>
      dispatch({ type: "REVEAL_HINT", maxHints: currentStation?.hints.length ?? 0 }),
    resetGame: () => dispatch({ type: "RESET_GAME" }),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
}
