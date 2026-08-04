import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "approved", "rejected"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin users (צוות הפקה) ───────────────────────────────────────────────
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: text("displayName"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// ─── Stations (תחנות) ──────────────────────────────────────────────────────
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  orderIndex: integer("orderIndex").notNull().default(0),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  clueText: text("clueText").notNull(),
  clueImageUrl: text("clueImageUrl"),
  taskTitle: varchar("taskTitle", { length: 255 }).notNull(),
  taskDescription: text("taskDescription").notNull(),
  taskImageUrl: text("taskImageUrl"),
  /** Mission type: photo (default) | puzzle | coordinates | morse */
  taskType: varchar("taskType", { length: 20 }).default("photo").notNull(),
  /** Expected answer for coordinates/morse missions (also drives the morse QR) */
  taskAnswer: text("taskAnswer"),
  /** Skip the scratch-card intro and open straight on the clue */
  skipScratch: boolean("skipScratch").default(false).notNull(),
  /** Optional audio clip played on the mission screen */
  taskAudioUrl: text("taskAudioUrl"),
  hint1: text("hint1"),
  hint2: text("hint2"),
  hint3: text("hint3"),
  wazeUrl: text("wazeUrl"),
  funFact: text("funFact"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

// ─── Teams (קבוצות) ────────────────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  teamName: varchar("teamName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  currentStationIndex: integer("currentStationIndex").default(0).notNull(),
  isFinished: boolean("isFinished").default(false).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ─── Submissions (הגשות תמונה) ─────────────────────────────────────────────
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  teamId: integer("teamId").notNull(),
  stationId: integer("stationId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  /** Optional message the team attached to the photo */
  caption: text("caption"),
  status: submissionStatusEnum("status").default("pending").notNull(),
  adminNote: text("adminNote"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
