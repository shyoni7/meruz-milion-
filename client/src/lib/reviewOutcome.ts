/**
 * reviewOutcome — decides what the production's review means for the team
 * waiting in the Control Room, given all their submissions for a station.
 *
 * Any approved submission advances the team. This must NOT look only at the
 * latest submission: extra photos/videos added while waiting, or a re-sent
 * completion (the puzzle stays solved, so re-sending is easy), create newer
 * pending submissions — and an approval the production already gave must
 * never be buried under them.
 */

export interface ReviewableSubmission {
  id: number;
  stationId: number;
  status: string;
  adminNote?: string | null;
}

export type ReviewOutcome =
  | { kind: "approved"; submissionId: number }
  | { kind: "rejected"; submissionId: number; adminNote: string | null }
  | { kind: "waiting" };

export function reviewOutcome(
  submissions: ReviewableSubmission[],
  stationId: number
): ReviewOutcome {
  const forStation = submissions.filter((s) => s.stationId === stationId);

  const approved = [...forStation].reverse().find((s) => s.status === "approved");
  if (approved) return { kind: "approved", submissionId: approved.id };

  // No approval yet — a rejection only counts if it's the team's latest
  // submission here (an older rejection followed by a new attempt means
  // they're waiting for the new attempt's review).
  const latest = forStation[forStation.length - 1];
  if (latest?.status === "rejected") {
    return { kind: "rejected", submissionId: latest.id, adminNote: latest.adminNote ?? null };
  }

  return { kind: "waiting" };
}
