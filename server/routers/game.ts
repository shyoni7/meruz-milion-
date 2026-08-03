import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTeam,
  getActiveStations,
  getStationById,
  getSubmissionsByTeam,
  getTeamById,
  markTeamFinished,
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
      return { success: true };
    }),

  // Mark team as finished
  finishGame: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .mutation(async ({ input }) => {
      await markTeamFinished(input.teamId);
      return { success: true };
    }),

  // Upload photo for a station task
  uploadPhoto: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        stationId: z.number(),
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
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
      });
      return { success: true, imageUrl: url };
    }),

  // Get submissions for a team
  getTeamSubmissions: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      return getSubmissionsByTeam(input.teamId);
    }),
});

