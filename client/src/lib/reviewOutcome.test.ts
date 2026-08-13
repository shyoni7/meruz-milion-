import { describe, expect, it } from "vitest";
import { reviewOutcome, type ReviewableSubmission } from "./reviewOutcome";

const sub = (
  id: number,
  status: string,
  stationId = 7,
  adminNote: string | null = null
): ReviewableSubmission => ({ id, stationId, status, adminNote });

describe("reviewOutcome", () => {
  it("waits when there are no submissions for the station", () => {
    expect(reviewOutcome([], 7)).toEqual({ kind: "waiting" });
    expect(reviewOutcome([sub(1, "approved", 99)], 7)).toEqual({ kind: "waiting" });
  });

  it("waits while the only submission is pending", () => {
    expect(reviewOutcome([sub(1, "pending")], 7)).toEqual({ kind: "waiting" });
  });

  it("advances on a single approved submission", () => {
    expect(reviewOutcome([sub(1, "approved")], 7)).toEqual({
      kind: "approved",
      submissionId: 1,
    });
  });

  // The regression: a newer pending submission (extra photo / re-sent
  // completion) must never bury an approval the production already gave.
  it("advances when an older submission is approved even if a newer one is pending", () => {
    const outcome = reviewOutcome([sub(1, "approved"), sub(2, "pending")], 7);
    expect(outcome).toEqual({ kind: "approved", submissionId: 1 });
  });

  it("prefers the newest approval when several exist", () => {
    const outcome = reviewOutcome([sub(1, "approved"), sub(2, "approved")], 7);
    expect(outcome).toEqual({ kind: "approved", submissionId: 2 });
  });

  it("rejects only when the latest submission is rejected", () => {
    expect(reviewOutcome([sub(1, "rejected", 7, "כמעט!")], 7)).toEqual({
      kind: "rejected",
      submissionId: 1,
      adminNote: "כמעט!",
    });
  });

  it("keeps waiting after a rejection once a new attempt was sent", () => {
    expect(reviewOutcome([sub(1, "rejected"), sub(2, "pending")], 7)).toEqual({
      kind: "waiting",
    });
  });

  it("advances when an attempt after a rejection is approved", () => {
    expect(reviewOutcome([sub(1, "rejected"), sub(2, "approved")], 7)).toEqual({
      kind: "approved",
      submissionId: 2,
    });
  });

  it("ignores other stations' submissions entirely", () => {
    const outcome = reviewOutcome(
      [sub(1, "approved", 3), sub(2, "rejected", 5), sub(3, "pending", 7)],
      7
    );
    expect(outcome).toEqual({ kind: "waiting" });
  });
});
