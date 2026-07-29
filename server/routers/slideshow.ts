import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getTeamById, getSubmissionsByTeam, getAllStations } from "../db";

export const slideshowRouter = router({
  // Get all data needed for the slideshow: team info, submissions with station data, and LLM captions
  getSlideshowData: publicProcedure
    .input(z.object({ teamId: z.number() }))
    .query(async ({ input }) => {
      const [team, allSubmissions, allStations] = await Promise.all([
        getTeamById(input.teamId),
        getSubmissionsByTeam(input.teamId),
        getAllStations(),
      ]);

      if (!team) throw new Error("Team not found");

      // Build a map of stationId -> station for quick lookup
      const stationMap = new Map(allStations.map((s) => [s.id, s]));

      // Enrich submissions with station info
      const enrichedSubmissions = allSubmissions.map((sub) => ({
        ...sub,
        station: stationMap.get(sub.stationId) ?? null,
      }));

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
      const prompt = `אתה כותב הערות שנונות ומצחיקות לאלבום תמונות של משחק "המירוץ ל-70" — מסע מיוחד לכבוד יום הולדת 70.

הקבוצה "${input.teamName}" השתתפה בתחנות הבאות:
${input.stationTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

כתוב הערה שנונה, חמה ומצחיקה בעברית לכל תחנה — בסגנון של מגיש תוכנית ריאליטי ישראלי. 
ההערה צריכה להיות קצרה (עד 15 מילים), שנונה, ולהתייחס לשם התחנה.
החזר JSON בדיוק בפורמט הזה:
{"captions": ["הערה לתחנה 1", "הערה לתחנה 2", ...]}`;

      try {
        const res = await invokeLLM({
          model: "gpt-5-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: {
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
        const parsed = JSON.parse(content) as { captions: string[] };
        return { captions: parsed.captions };
      } catch (err) {
        console.error("[Slideshow] LLM caption generation failed:", err);
        // Fallback captions
        return {
          captions: input.stationTitles.map((t) => `תחנת ${t} — רגע בלתי נשכח! 🌟`),
        };
      }
    }),
});
