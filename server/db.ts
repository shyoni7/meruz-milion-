import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  adminUsers,
  InsertAdminUser,
  InsertStation,
  InsertSubmission,
  InsertTeam,
  InsertUser,
  stations,
  submissions,
  teams,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { storageDelete } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Station queries ───────────────────────────────────────────────────────

export async function getActiveStations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stations).where(eq(stations.isActive, true)).orderBy(stations.orderIndex);
}

export async function getAllStations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stations).orderBy(stations.orderIndex);
}

export async function getStationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stations).where(eq(stations.id, id)).limit(1);
  return result[0];
}

export async function createStation(data: InsertStation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(stations).values(data);
}

export async function updateStation(id: number, data: Partial<InsertStation>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(stations).set(data).where(eq(stations.id, id));
}

export async function deleteStation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(stations).where(eq(stations.id, id));
}

// ─── Team queries ──────────────────────────────────────────────────────────

export async function createTeam(data: InsertTeam) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(teams).values(data).returning();
  return result[0];
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result[0];
}

export async function getAllTeams() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).orderBy(teams.createdAt);
}

export async function updateTeamProgress(id: number, currentStationIndex: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(teams).set({ currentStationIndex }).where(eq(teams.id, id));
}

export async function markTeamFinished(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(teams).set({ isFinished: true, finishedAt: new Date() }).where(eq(teams.id, id));
}

// ─── Submission queries ────────────────────────────────────────────────────

export async function createSubmission(data: InsertSubmission) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(submissions).values(data);
}

export async function getSubmissionsByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(eq(submissions.teamId, teamId)).orderBy(submissions.submittedAt);
}

export async function getAllSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).orderBy(submissions.submittedAt);
}

export async function updateSubmissionStatus(
  id: number,
  status: "approved" | "rejected",
  adminNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(submissions)
    .set({ status, adminNote: adminNote ?? null, reviewedAt: new Date() })
    .where(eq(submissions.id, id));
}

export async function deleteSubmission(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete S3 file first
  const rows = await db.select({ imageKey: submissions.imageKey }).from(submissions).where(eq(submissions.id, id)).limit(1);
  if (rows[0]?.imageKey) {
    await storageDelete(rows[0].imageKey).catch(() => {});
  }
  await db.delete(submissions).where(eq(submissions.id, id));
}

export async function deleteTeam(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete S3 files for all team submissions first
  const teamSubs = await db.select({ imageKey: submissions.imageKey }).from(submissions).where(eq(submissions.teamId, id));
  await Promise.all(teamSubs.map((s) => storageDelete(s.imageKey).catch(() => {})));
  await db.delete(submissions).where(eq(submissions.teamId, id));
  await db.delete(teams).where(eq(teams.id, id));
}

// ─── Admin user queries ────────────────────────────────────────────────────

export async function getAdminByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  return result[0];
}

export async function createAdminUser(data: InsertAdminUser) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(adminUsers).values(data);
}
