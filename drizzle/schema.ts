import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin users (צוות הפקה) ───────────────────────────────────────────────
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: text("displayName"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// ─── Stations (תחנות) ──────────────────────────────────────────────────────
export const stations = mysqlTable("stations", {
  id: int("id").autoincrement().primaryKey(),
  orderIndex: int("orderIndex").notNull().default(0),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  clueText: text("clueText").notNull(),
  clueImageUrl: text("clueImageUrl"),
  taskTitle: varchar("taskTitle", { length: 255 }).notNull(),
  taskDescription: text("taskDescription").notNull(),
  taskImageUrl: text("taskImageUrl"),
  hint1: text("hint1"),
  hint2: text("hint2"),
  hint3: text("hint3"),
  wazeUrl: text("wazeUrl"),
  funFact: text("funFact"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

// ─── Teams (קבוצות) ────────────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  teamName: varchar("teamName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  currentStationIndex: int("currentStationIndex").default(0).notNull(),
  isFinished: boolean("isFinished").default(false).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ─── Submissions (הגשות תמונה) ─────────────────────────────────────────────
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  stationId: int("stationId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
