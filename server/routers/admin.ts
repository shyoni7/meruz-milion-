import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import {
  createAdminUser,
  createStation,
  deleteStation,
  getAdminByUsername,
  getAllStations,
  getAllSubmissions,
  getAllTeams,
  updateStation,
  updateSubmissionStatus,
} from "../db";
import {
  deleteSubmission,
  deleteTeam,
} from "../db";
import { publicProcedure, router } from "../_core/trpc";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "hamerutz-admin-secret-2024"
);

async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return payload as { adminId: number; username: string };
  } catch {
    return null;
  }
}

// Middleware-like helper to extract and verify admin token from input
async function requireAdmin(token: string) {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
  return payload;
}

export const adminRouter = router({
  // Admin login
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const admin = await getAdminByUsername(input.username);
      if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const token = await new SignJWT({ adminId: admin.id, username: admin.username })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(ADMIN_JWT_SECRET);
      return { token, displayName: admin.displayName ?? admin.username };
    }),

  // Verify token (for page refresh)
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const payload = await verifyAdminToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED" });
      return payload;
    }),

  // Setup: create first admin (only if no admins exist)
  setupAdmin: publicProcedure
    .input(z.object({ username: z.string().min(3), password: z.string().min(6), displayName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const existing = await getAdminByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Admin already exists" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      await createAdminUser({ username: input.username, passwordHash, displayName: input.displayName });
      return { success: true };
    }),

  // ─── Station management ──────────────────────────────────────────────────
  getStations: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      await requireAdmin(input.token);
      return getAllStations();
    }),

  createStation: publicProcedure
    .input(
      z.object({
        token: z.string(),
        orderIndex: z.number(),
        title: z.string().min(1),
        subtitle: z.string().optional(),
        clueText: z.string().min(1),
        clueImageUrl: z.string().optional(),
        taskTitle: z.string().min(1),
        taskDescription: z.string().min(1),
        taskImageUrl: z.string().optional(),
        taskType: z.enum(["photo", "puzzle", "coordinates", "morse"]).optional(),
        taskAnswer: z.string().optional(),
        hint1: z.string().optional(),
        hint2: z.string().optional(),
        hint3: z.string().optional(),
        wazeUrl: z.string().optional(),
        funFact: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      const { token: _t, ...data } = input;
      await createStation(data);
      return { success: true };
    }),

  updateStation: publicProcedure
    .input(
      z.object({
        token: z.string(),
        id: z.number(),
        orderIndex: z.number().optional(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        clueText: z.string().optional(),
        clueImageUrl: z.string().optional(),
        taskTitle: z.string().optional(),
        taskDescription: z.string().optional(),
        taskImageUrl: z.string().optional(),
        taskType: z.enum(["photo", "puzzle", "coordinates", "morse"]).optional(),
        taskAnswer: z.string().optional(),
        hint1: z.string().optional(),
        hint2: z.string().optional(),
        hint3: z.string().optional(),
        wazeUrl: z.string().optional(),
        funFact: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      const { token: _t, id, ...data } = input;
      await updateStation(id, data);
      return { success: true };
    }),

  deleteStation: publicProcedure
    .input(z.object({ token: z.string(), id: z.number() }))
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      await deleteStation(input.id);
      return { success: true };
    }),

  // ─── Teams overview ──────────────────────────────────────────────────────
  getTeams: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      await requireAdmin(input.token);
      return getAllTeams();
    }),

  // ─── Submissions review ──────────────────────────────────────────────────
  getSubmissions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      await requireAdmin(input.token);
      return getAllSubmissions();
    }),

  reviewSubmission: publicProcedure
    .input(
      z.object({
        token: z.string(),
        submissionId: z.number(),
        status: z.enum(["approved", "rejected"]),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      await updateSubmissionStatus(input.submissionId, input.status, input.adminNote);
      return { success: true };
    }),

  deleteSubmission: publicProcedure
    .input(z.object({ token: z.string(), submissionId: z.number() }))
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      await deleteSubmission(input.submissionId);
      return { success: true };
    }),

  deleteTeam: publicProcedure
    .input(z.object({ token: z.string(), teamId: z.number() }))
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      await deleteTeam(input.teamId);
      return { success: true };
    }),

  // Upload an image (e.g. a puzzle image) to Blob storage, returns its URL
  uploadImage: publicProcedure
    .input(
      z.object({
        token: z.string(),
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      await requireAdmin(input.token);
      const { storagePut } = await import("../storage");
      const buffer = Buffer.from(input.imageBase64, "base64");
      const key = `stations/image-${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});
