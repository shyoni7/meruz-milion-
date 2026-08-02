// Vercel serverless entry point.
// The real Express app lives in server/vercel.ts and is bundled by the build
// step into dist/server.mjs (see the "build" script in package.json).
// Importing the pre-bundled file with an explicit extension avoids Node ESM
// resolution failures for extensionless per-file compiled TypeScript imports.
// @ts-ignore — dist/server.mjs is generated at build time
import app from "../dist/server.mjs";

export default app;
