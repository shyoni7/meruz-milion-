export const ENV = {
  // Auth & session
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // LLM (OpenAI or OpenAI-compatible)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiApiUrl: process.env.OPENAI_API_URL ?? "https://api.openai.com",

  // Cloudinary storage
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",

  // Legacy Manus Forge aliases (kept for backward compatibility during migration)
  // These will be empty in production Vercel deployments
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_API_URL ?? "https://api.openai.com",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",

  // Manus OAuth (not used by game/admin — kept for compatibility)
  appId: process.env.VITE_APP_ID ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
};
