import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import path from "path";
import fs from "fs";
import * as bcrypt from "bcryptjs";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { getAdminByUsername, createAdminUser, getDb } from "../server/db";

const app = express();

// ─── Auto-migrate on startup ─────────────────────────────────────────────────
// Applies pending SQL migrations from the drizzle/ folder so the database
// schema is always up to date. Idempotent — already-applied migrations are
// tracked by drizzle and skipped, so this is safe on every cold start.
async function migrateDb() {
  const db = await getDb();
  if (!db) return; // no DATABASE_URL configured — skip
  try {
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    console.log("[migrate] Database schema is up to date");
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
  }
}

// ─── Auto-seed admin from environment variables ──────────────────────────────
// If ADMIN_USERNAME and ADMIN_PASSWORD are set and no admin with that username
// exists yet, create it automatically on startup. Safe to run on every deploy.
async function seedAdminFromEnv() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? "צוות הפקה";

  if (!username || !password) return; // env vars not set — skip

  try {
    const existing = await getAdminByUsername(username);
    if (existing) {
      console.log(`[seed] Admin "${username}" already exists — skipping`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await createAdminUser({ username, passwordHash, displayName });
    console.log(`[seed] Admin "${username}" created successfully`);
  } catch (err) {
    console.error("[seed] Failed to create admin from env:", err);
  }
}

// Run migration + seed once per cold start; requests wait until it finishes
// so the very first request after connecting a fresh database still works.
const initPromise = migrateDb().then(seedAdminFromEnv);

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(async (_req, _res, next) => {
  await initPromise.catch(() => {});
  next();
});

registerStorageProxy(app);
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static frontend when running as a standalone server (pnpm start).
// On Vercel the CDN serves dist/public directly, so this block is skipped.
const distPath = path.resolve(process.cwd(), "dist", "public");
if (!process.env.VERCEL && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export default app;
