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
import { getAdminByUsername, createAdminUser, updateAdminPassword, getDb } from "../server/db";

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
  // trim() guards against stray whitespace/newlines pasted into the dashboard
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const displayName = process.env.ADMIN_DISPLAY_NAME?.trim() || "צוות הפקה";

  if (!username || !password) return; // env vars not set — skip

  try {
    const existing = await getAdminByUsername(username);
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 10);
      await createAdminUser({ username, passwordHash, displayName });
      console.log(`[seed] Admin "${username}" created successfully`);
      return;
    }
    // Keep the stored password in sync with ADMIN_PASSWORD so changing the
    // env var (+ redeploy) is all it takes to change the admin password.
    const matches = await bcrypt.compare(password, existing.passwordHash);
    if (!matches) {
      const passwordHash = await bcrypt.hash(password, 10);
      await updateAdminPassword(username, passwordHash);
      console.log(`[seed] Admin "${username}" password updated from env`);
    } else {
      console.log(`[seed] Admin "${username}" already up to date`);
    }
  } catch (err) {
    console.error("[seed] Failed to seed admin from env:", err);
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

// Client-side Blob uploads (large files like videos bypass the ~4.5MB
// serverless request limit by uploading straight to Blob storage).
app.post("/api/blob/upload", async (req, res) => {
  try {
    const { handleUpload } = await import("@vercel/blob/client");
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
          "video/mp4", "video/quicktime", "video/webm", "video/3gpp",
        ],
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Submission rows are created by the client via game.recordSubmission
      },
    });
    res.json(jsonResponse);
  } catch (err) {
    console.error("[blob-upload] failed:", err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// Configuration health check — booleans only, no secrets exposed.
app.get("/api/health", (_req, res) => {
  res.json({
    database: Boolean(process.env.DATABASE_URL),
    blobStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    jwtSecret: Boolean(process.env.JWT_SECRET),
    adminSeed: Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD),
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC] ${path ?? "<unknown>"} failed: ${error.message}`, error.cause ?? "");
    },
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
