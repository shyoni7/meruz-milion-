import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getTeamById, getAllStations, getAllTeams } from "../db";
import { getDb } from "../db";
import { submissions } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export const slideshowRouter = router({
  // ─── Global slideshow: all photos from all teams, grouped by station ────────
  getAllSlideshowData: publicProcedure.query(async () => {
    const [allStations, allTeams] = await Promise.all([
      getAllStations(),
      getAllTeams(),
    ]);

    const db = await getDb();
    // Completion markers (solved puzzle / correct answer) have no media —
    // they exist only for production approval, so keep them out of the show
    const allSubmissions = (db
      ? await db.select().from(submissions).orderBy(asc(submissions.stationId))
      : []
    ).filter((s) => s.mediaType !== "completion");

    // Build lookup maps
    const stationMap = new Map(allStations.map((s) => [s.id, s]));
    const teamMap = new Map(allTeams.map((t) => [t.id, t]));

    // Enrich each submission with station + team info
    const enriched = allSubmissions.map((sub) => ({
      ...sub,
      station: stationMap.get(sub.stationId) ?? null,
      team: teamMap.get(sub.teamId) ?? null,
    }));

    // Sort by station orderIndex, then by submittedAt within same station
    enriched.sort((a, b) => {
      const aOrder = a.station?.orderIndex ?? 0;
      const bOrder = b.station?.orderIndex ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    return { submissions: enriched, stations: allStations };
  }),

  // ─── Per-team slideshow (legacy, kept for admin use) ────────────────────────
  getSlideshowData: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      const [team, allStations] = await Promise.all([
        getTeamById(input.teamId),
        getAllStations(),
      ]);

      if (!team) throw new Error("Team not found");

      // Fetch submissions sorted by stationId (orderIndex via join)
      const db = await getDb();
      const allSubmissions = (db
        ? await db
            .select()
            .from(submissions)
            .where(eq(submissions.teamId, input.teamId))
            .orderBy(asc(submissions.stationId))
        : []
      ).filter((s) => s.mediaType !== "completion");

      // Build a map of stationId -> station for quick lookup
      const stationMap = new Map(allStations.map((s) => [s.id, s]));

      // Enrich submissions with station info, sorted by station orderIndex
      const enrichedSubmissions = allSubmissions
        .map((sub) => ({
          ...sub,
          station: stationMap.get(sub.stationId) ?? null,
        }))
        .sort((a, b) => (a.station?.orderIndex ?? 0) - (b.station?.orderIndex ?? 0));

      return { team, submissions: enrichedSubmissions };
    }),

  // Generate witty Hebrew captions for each station using LLM
  generateCaptions: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        stationTitles: z.array(z.string()),
        teamName: z.string(),
      })
    )
      .mutation(async ({ input }) => {
      // AI captions are disabled when OPENAI_API_KEY is not set.
      // To enable: set OPENAI_API_KEY in environment variables.
      const apiKeyAvailable = !!(process.env.OPENAI_API_KEY || process.env.BUILT_IN_FORGE_API_KEY);

      if (!apiKeyAvailable) {
        // Return empty captions — slideshow will show photos without text overlays
        return { captions: input.stationTitles.map(() => "") };
      }

      const prompt = `אתה כותב הערות שנונות ומצחיקות לאלבום תמונות של משחק "המירוץ ל-70" — מסע מיוחד לכבוד יום הולדת 70.

הקבוצה "${input.teamName}" השתתפה בתחנות הבאות:
${input.stationTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

כתוב הערה שנונה, חמה ומצחיקה בעברית לכל תחנה — בסגנון של מגיש תוכנית ריאליטי ישראלי. 
ההערה צריכה להיות קצרה (עד 15 מילים), שנונה, ולהתייחס לשם התחנה.
החזר JSON בדיוק בפורמט הזה:
{"captions": ["הערה לתחנה 1", "הערה לתחנה 2", ...]}`;

      try {
        const res = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          responseFormat: {
            type: "json_schema",
            json_schema: {
              name: "captions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  captions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["captions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = (res.choices[0]?.message?.content as string) ?? "{}";
        const parsed = JSON.parse(content) as { captions?: string[] };
        const captions = Array.isArray(parsed.captions) ? parsed.captions : [];
        return { captions };
      } catch (err) {
        console.error("[Slideshow] LLM caption generation failed:", err);
        return { captions: input.stationTitles.map(() => "") };
      }
    }),
});
