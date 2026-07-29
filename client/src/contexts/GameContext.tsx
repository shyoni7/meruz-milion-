/**
 * HaMerutz L-70 — Game Context
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Manages the entire game state:
 * - Which station we're on
 * - Which screen is currently shown
 * - How many hints have been revealed
 * - Whether the game is finished
 */

import React, { createContext, useContext, useReducer } from "react";
import {
  GameState,
  ScreenType,
  initialGameState,
  stations,
} from "@/data/stations";

// ── Actions ──────────────────────────────────────────────────────────────────

type GameAction =
  | { type: "SCRATCH_REVEALED" }        // SCRATCH → CLUE
  | { type: "ADVANCE_SCREEN" }         // CLUE → TASK
  | { type: "GO_TO_CONTROL_ROOM" }     // TASK → CONTROL_ROOM
  | { type: "APPROVE_MISSION" }        // CONTROL_ROOM → COMPLETE
  | { type: "RETRY_MISSION" }          // CONTROL_ROOM → TRY_AGAIN
  | { type: "RETRY_PHOTO" }            // TRY_AGAIN → CONTROL_ROOM
  | { type: "NEXT_STATION" }           // COMPLETE → next CLUE (or finish)
  | { type: "REVEAL_HINT" }            // reveal next hint
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
      // TRY_AGAIN → CONTROL_ROOM (after retaking photo)
      return { ...state, currentScreen: "CONTROL_ROOM" };
    }

    case "NEXT_STATION": {
      // COMPLETE → next station's CLUE, or finish
      const nextIndex = state.currentStationIndex + 1;
      if (nextIndex >= stations.length) {
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
      const station = stations[state.currentStationIndex];
      const maxHints = station.hints.length;
      if (state.hintsRevealed < maxHints) {
        return { ...state, hintsRevealed: state.hintsRevealed + 1 };
      }
      return state;
    }

    case "RESET_GAME": {
      return { ...initialGameState };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  currentStation: (typeof stations)[0];
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

  const currentStation = stations[state.currentStationIndex];

  const value: GameContextValue = {
    state,
    currentStation,
    dispatch,
    scratchRevealed: () => dispatch({ type: "SCRATCH_REVEALED" }),
    advanceScreen: () => dispatch({ type: "ADVANCE_SCREEN" }),
    goToControlRoom: () => dispatch({ type: "GO_TO_CONTROL_ROOM" }),
    approveMission: () => dispatch({ type: "APPROVE_MISSION" }),
    retryMission: () => dispatch({ type: "RETRY_MISSION" }),
    retryPhoto: () => dispatch({ type: "RETRY_PHOTO" }),
    nextStation: () => dispatch({ type: "NEXT_STATION" }),
    revealHint: () => dispatch({ type: "REVEAL_HINT" }),
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
