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
import { getAdminByUsername, createAdminUser } from "../server/db";

const app = express();

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

// Run seed on startup (non-blocking)
seedAdminFromEnv();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
