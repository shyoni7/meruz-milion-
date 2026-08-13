/**
 * solvedMissions — remembers which missions a team already solved on this
 * device, so going back to a station never forces re-solving the puzzle or
 * re-typing a correct answer. Keyed by team + station, stored in localStorage
 * (survives refreshes, rejections by production, and moving back in the game).
 */

const STORAGE_KEY = "hamerutz_solved_missions";

type SolvedMap = Record<string, true>;

function readMap(): SolvedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as SolvedMap) : {};
  } catch {
    return {};
  }
}

function entryKey(teamId: number, stationKey: string | number): string {
  return `${teamId}:${stationKey}`;
}

export function isMissionSolved(teamId: number, stationKey: string | number): boolean {
  return readMap()[entryKey(teamId, stationKey)] === true;
}

export function markMissionSolved(teamId: number, stationKey: string | number): void {
  try {
    const map = readMap();
    map[entryKey(teamId, stationKey)] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Private mode / quota errors — the game still works, just without memory
  }
}

/** Wipe all remembered solves (used when the device signs out of the game) */
export function clearAllSolvedMissions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
