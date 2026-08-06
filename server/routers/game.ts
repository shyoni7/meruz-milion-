import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addBlessing,
  completeOpenLogs,
  completeStationLog,
  createTeam,
  getActiveStations,
  getAllBlessings,
  getAllTeams,
  getLogsByTeam,
  getStationById,
  getSubmissionsByTeam,
  getTeamById,
  markTeamFinished,
  startStationLog,
  updateTeamProgress,
} from "../db";
import { storagePut } from "../storage";
import { publicProcedure, router } from "../_core/trpc";

export const gameRouter = router({
  // Register a new team (name + phone)
  registerTeam: publicProcedure
    .input(z.object({ teamName: z.string().min(2).max(100), phone: z.string().min(9).max(20) }))
    .mutation(async ({ input }) => {
      await createTeam({ teamName: input.teamName, phone: input.phone });
      // Return team by re-querying (insertId not directly returned by drizzle mysql2)
      // We'll store teamId in localStorage on client side after registration
      return { success: true };
    }),

  // Register team and get back the team id
  registerTeamWithId: publicProcedure
    .input(z.object({ teamName: z.string().min(2).max(100), phone: z.string().min(9).max(20) }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { teams } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const [created] = await db
        .insert(teams)
        .values({ teamName: input.teamName, phone: input.phone })
        .returning({ id: teams.id });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create team" });
      return { teamId: created.id };
    }),

  // Get all active stations (public — no auth needed).
  // taskAnswer is stripped so the correct answer never reaches the client.
  getStations: publicProcedure.query(async () => {
    const stations = await getActiveStations();
    return stations.map(({ taskAnswer: _a, ...rest }) => rest);
  }),

  // Get a single station by id
  getStation: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const station = await getStationById(input.id);
      if (!station) throw new TRPCError({ code: "NOT_FOUND", message: "Station not found" });
      const { taskAnswer: _a, ...rest } = station;
      return rest;
    }),

  // Check a typed answer for coordinates/morse missions (server-side so the
  // correct answer never reaches the client)
  checkAnswer: publicProcedure
    .input(z.object({ stationId: z.number(), answer: z.string().max(200) }))
    .mutation(async ({ input }) => {
      const station = await getStationById(input.stationId);
      if (!station) throw new TRPCError({ code: "NOT_FOUND", message: "Station not found" });
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^0-9a-z\u0590-\u05FF.]/g, "");
      const expected = normalize(station.taskAnswer ?? "");
      if (!expected) return { correct: false };
      return { correct: normalize(input.answer) === expected };
    }),

  // Get team progress
  getTeam: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      const team = await getTeamById(input.teamId);
      if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      return team;
    }),

  // Advance team to next station
  advanceStation: publicProcedure
    .input(z.object({ teamId: z.number(), nextIndex: z.number() }))
    .mutation(async ({ input }) => {
      await updateTeamProgress(input.teamId, input.nextIndex);
      // Close the timing log of the station that was just completed
      if (input.nextIndex > 0) {
        await completeStationLog(input.teamId, input.nextIndex - 1).catch(() => {});
      }
      return { success: true };
    }),

  // Mark team as finished
  finishGame: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ input }) => {
      await markTeamFinished(input.teamId);
      await completeOpenLogs(input.teamId).catch(() => {});
      return { success: true };
    }),

  // Record that a team entered a station (idempotent). Returns startedAt for
  // the on-screen mission timer.
  startStation: publicProcedure
    .input(z.object({ teamId: z.number(), stationIndex: z.number() }))
    .mutation(async ({ input }) => {
      const log = await startStationLog(input.teamId, input.stationIndex);
      return { startedAt: log?.startedAt ?? new Date() };
    }),

  // Team standing + per-station times (rank revealed mid-race and at the end)
  getTeamStats: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      const [allTeams, logs] = await Promise.all([getAllTeams(), getLogsByTeam(input.teamId)]);
      const ranked = [...allTeams].sort((a, b) => {
        if (a.isFinished !== b.isFinished) return a.isFinished ? -1 : 1;
        if (a.isFinished && b.isFinished) {
          return (a.finishedAt?.getTime() ?? 0) - (b.finishedAt?.getTime() ?? 0);
        }
        if (a.currentStationIndex !== b.currentStationIndex) {
          return b.currentStationIndex - a.currentStationIndex;
        }
        return (a.startedAt?.getTime() ?? 0) - (b.startedAt?.getTime() ?? 0);
      });
      const rank = ranked.findIndex((t) => t.id === input.teamId) + 1;
      const me = allTeams.find((t) => t.id === input.teamId);
      const totalMs =
        me?.isFinished && me.finishedAt
          ? me.finishedAt.getTime() - me.startedAt.getTime()
          : null;
      return {
        rank: rank || null,
        totalTeams: allTeams.length,
        totalMs,
        stations: logs.map((l) => ({
          stationIndex: l.stationIndex,
          durationMs: l.completedAt ? l.completedAt.getTime() - l.startedAt.getTime() : null,
        })),
      };
    }),

  // Blessing for the guest of honor (written at the finish screen)
  addBlessing: publicProcedure
    .input(z.object({ teamId: z.number(), text: z.string().min(2).max(1000) }))
    .mutation(async ({ input }) => {
      const team = await getTeamById(input.teamId);
      await addBlessing(input.teamId, team?.teamName ?? null, input.text.trim());
      return { success: true };
    }),

  // All blessings (shown in the slideshow)
  getBlessings: publicProcedure.query(async () => {
    return getAllBlessings();
  }),

  // Upload photo for a station task
  uploadPhoto: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        stationId: z.number(),
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        caption: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { createSubmission } = await import("../db");
      const buffer = Buffer.from(input.imageBase64, "base64");
      const key = `submissions/team-${input.teamId}/station-${input.stationId}-${Date.now()}.jpg`;
      const { url, key: storedKey } = await storagePut(key, buffer, input.mimeType);
      await createSubmission({
        teamId: input.teamId,
        stationId: input.stationId,
        imageUrl: url,
        imageKey: storedKey,
        caption: input.caption?.trim() || null,
      });
      return { success: true, imageUrl: url };
    }),

  // Record that a team completed a self-checked mission (puzzle / typed
  // answer). Creates a pending "completion" submission so the production
  // team explicitly approves the advance — no mission auto-advances.
  submitCompletion: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        stationId: z.number(),
        kind: z.enum(["puzzle", "coordinates", "morse"]),
      })
    )
    .mutation(async ({ input }) => {
      const { createSubmission } = await import("../db");
      const captions: Record<typeof input.kind, string> = {
        puzzle: "🧩 הפאזל הורכב בהצלחה",
        coordinates: "🔑 הוקלד הקוד הנכון",
        morse: "📡 קוד המורס פוענח נכון",
      };
      await createSubmission({
        teamId: input.teamId,
        stationId: input.stationId,
        imageUrl: "",
        imageKey: "",
        mediaType: "completion",
        caption: captions[input.kind],
      });
      return { success: true };
    }),

  // Record a submission whose file was uploaded client-side to Blob storage
  // (used for videos / large files that bypass the serverless body limit)
  recordSubmission: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        stationId: z.number(),
        url: z.string().url().max(1000),
        mediaType: z.enum(["image", "video"]).default("image"),
        caption: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { createSubmission } = await import("../db");
      await createSubmission({
        teamId: input.teamId,
        stationId: input.stationId,
        imageUrl: input.url,
        imageKey: input.url,
        mediaType: input.mediaType,
        caption: input.caption?.trim() || null,
      });
      return { success: true };
    }),

  // Get submissions for a team
  getTeamSubmissions: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      return getSubmissionsByTeam(input.teamId);
    }),
});

